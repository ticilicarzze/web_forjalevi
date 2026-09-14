#!/usr/bin/env node

/**
 * FORJA LEVI — Gestor de Precios y Tarifas por Tier / Arquetipo
 * 
 * Permite listar y actualizar precios masivamente (ej: todos los héroes,
 * todos los goblins/esqueletos, monstruos, etc.) sin editar producto por producto.
 *
 * Ejemplos de uso:
 *   node scripts/precios.js                     -> Ver tabla de todas las tarifas y productos
 *   node scripts/precios.js --sync              -> Sincroniza todos los productos con sus tiers y actualiza products-data.js
 *   node scripts/precios.js --set heroe 5000    -> Cambia precio base de todos los héroes a $5.000
 *   node scripts/precios.js --set esbirro 4000 --paint 2500 -> Cambia base y pintado de esbirros
 *   node scripts/precios.js --inflate 10        -> Aplica +10% de aumento a todos los tiers (redondeado a $100)
 */

const fs = require('fs');
const path = require('path');

const PRODUCTS_JSON_PATH = path.resolve(__dirname, '../data/products.json');
const PRODUCTS_DATA_JS_PATH = path.resolve(__dirname, '../js/products-data.js');

function loadData() {
  if (!fs.existsSync(PRODUCTS_JSON_PATH)) {
    console.error('❌ Error: no se encontró data/products.json');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(PRODUCTS_JSON_PATH, 'utf8'));
}

function saveData(data) {
  // 1. Guardar data/products.json
  fs.writeFileSync(PRODUCTS_JSON_PATH, JSON.stringify(data, null, 2) + '\n', 'utf8');

  // 2. Guardar js/products-data.js para soporte file://, offline y carga ultra rápida
  const jsContent = `/**
 * FORJA LEVI — Catálogo de Productos y Modelo Canónico
 * Sincronizado automáticamente por scripts/precios.js
 */

window.FORJA_CATALOG_DATA = ${JSON.stringify(data, null, 2)};
window.FORJA_CATALOG = window.FORJA_CATALOG_DATA.products;
`;
  fs.writeFileSync(PRODUCTS_DATA_JS_PATH, jsContent, 'utf8');

  console.log('✅ Archivos data/products.json y js/products-data.js actualizados y sincronizados con éxito.\n');
}

function formatAR(num) {
  return '$' + Number(num || 0).toLocaleString('es-AR');
}

function showHelp() {
  console.log(`
FORJA LEVI — Gestor de Tarifas y Precios
=========================================

Uso:
  node scripts/precios.js                          Lista todos los tiers y productos vinculados
  node scripts/precios.js --sync                   Sincroniza todos los productos con sus tiers
  node scripts/precios.js --set <tier> <precio>    Modifica el precio base de un tier
  node scripts/precios.js --set <tier> <precio> --paint <costo>
                                                   Modifica precio base y costo de pintura
  node scripts/precios.js --inflate <porcentaje>   Aumenta todos los precios un X% (ej: 10 para +10%)
  node scripts/precios.js --help                   Muestra esta ayuda

Ejemplos:
  node scripts/precios.js --set heroe 5000 --paint 10000
  node scripts/precios.js --set esbirro 4000 --paint 2500
  node scripts/precios.js --set pack-esbirros-x5 18000 --paint 25000
  node scripts/precios.js --inflate 15
  node scripts/precios.js --sync
`);
}

function listTiers(data) {
  console.log('\n========================================================================================');
  console.log('                    FORJA LEVI — LISTA DE TARIFAS Y TIERS                              ');
  console.log('========================================================================================');

  const tiers = data.tiers || {};
  const products = data.products || [];

  if (Object.keys(tiers).length === 0) {
    console.log('⚠️  No hay tiers definidos en data/products.json');
    return;
  }

  // Header
  console.log(
    'TIER ID'.padEnd(20) +
    'NOMBRE / DESCRIPCIÓN'.padEnd(32) +
    'BASE ($)'.padEnd(12) +
    'PINTADO ($)'.padEnd(14) +
    'PROD.'
  );
  console.log('─'.repeat(88));

  for (const [tierKey, tierData] of Object.entries(tiers)) {
    const linkedCount = products.filter(p => p.tier === tierKey).length;
    const baseStr = formatAR(tierData.price);
    const paintStr = tierData.painting_cost ? formatAR(tierData.painting_cost) : 'N/A';
    const nameStr = (tierData.name || tierKey).substring(0, 30);

    console.log(
      tierKey.padEnd(20) +
      nameStr.padEnd(32) +
      baseStr.padEnd(12) +
      paintStr.padEnd(14) +
      `${linkedCount}`
    );
  }

  console.log('─'.repeat(88));
  console.log(`Total productos vinculados a tiers: ${products.filter(p => p.tier).length} de ${products.length}\n`);
}

function syncAll(data) {
  const tiers = data.tiers || {};
  let count = 0;
  (data.products || []).forEach(p => {
    if (p.tier && tiers[p.tier]) {
      const t = tiers[p.tier];
      if (!p.overridePrice && t.price !== undefined) {
        p.price = t.price;
        count++;
      }
      if (p.painting && p.painting.available && !p.overridePaintCost && t.painting_cost !== undefined) {
        p.painting.cost = t.painting_cost;
      }
    }
  });

  console.log(`\n🔄 Sincronizando ${count} productos según sus tarifas vigentes...`);
  saveData(data);
  listTiers(data);
}

function setTierPrice(data, tierKey, newPrice, newPaint) {
  data.tiers = data.tiers || {};
  if (!data.tiers[tierKey]) {
    console.error(`❌ El tier "${tierKey}" no existe en data/products.json.`);
    console.log(`Tiers disponibles: ${Object.keys(data.tiers).join(', ')}`);
    process.exit(1);
  }

  const tier = data.tiers[tierKey];
  const oldPrice = tier.price;
  tier.price = Number(newPrice);

  console.log(`\n🎯 Tier "${tierKey}" (${tier.name || tierKey}):`);
  console.log(`   • Precio Base: ${formatAR(oldPrice)} ➜ ${formatAR(tier.price)}`);

  if (newPaint !== undefined && newPaint !== null) {
    const oldPaint = tier.painting_cost;
    tier.painting_cost = Number(newPaint);
    console.log(`   • Pintura: ${formatAR(oldPaint)} ➜ ${formatAR(tier.painting_cost)}`);
  }

  // Sincronizar también p.price en los productos que usan este tier (si no tienen override)
  const products = data.products || [];
  let updatedCount = 0;
  products.forEach(p => {
    if (p.tier === tierKey && !p.overridePrice) {
      p.price = tier.price;
      if (p.painting && p.painting.available && !p.overridePaintCost && tier.painting_cost !== undefined) {
        p.painting.cost = tier.painting_cost;
      }
      updatedCount++;
    }
  });

  console.log(`   • Productos sincronizados automáticamente: ${updatedCount}`);
  saveData(data);
}

function inflateAll(data, percentage) {
  const factor = 1 + (percentage / 100);
  console.log(`\n📈 Aplicando aumento general de +${percentage}% a todos los tiers...`);

  data.tiers = data.tiers || {};

  for (const [key, tier] of Object.entries(data.tiers)) {
    if (typeof tier.price === 'number' && tier.price > 0) {
      const rawPrice = tier.price * factor;
      tier.price = Math.round(rawPrice / 100) * 100;
    }
    if (typeof tier.painting_cost === 'number' && tier.painting_cost > 0) {
      const rawPaint = tier.painting_cost * factor;
      tier.painting_cost = Math.round(rawPaint / 100) * 100;
    }
  }

  // Sincronizar en productos vinculados
  let count = 0;
  (data.products || []).forEach(p => {
    if (p.tier && data.tiers[p.tier] && !p.overridePrice) {
      p.price = data.tiers[p.tier].price;
      if (p.painting && p.painting.available && !p.overridePaintCost && data.tiers[p.tier].painting_cost !== undefined) {
        p.painting.cost = data.tiers[p.tier].painting_cost;
      }
      count++;
    }
  });

  console.log(`   • Tiers actualizados: ${Object.keys(data.tiers).length}`);
  console.log(`   • Productos sincronizados: ${count}`);
  saveData(data);
  listTiers(data);
}

// ── Main CLI Runner ──
const args = process.argv.slice(2);
const data = loadData();

if (args.length === 0 || args.includes('--list')) {
  listTiers(data);
  process.exit(0);
}

if (args.includes('--sync')) {
  syncAll(data);
  process.exit(0);
}

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--set')) {
  const setIdx = args.indexOf('--set');
  const tierKey = args[setIdx + 1];
  const newPrice = args[setIdx + 2];

  if (!tierKey || !newPrice || isNaN(newPrice)) {
    console.error('❌ Error: Formato incorrecto. Uso: node scripts/precios.js --set <tier> <precio>');
    process.exit(1);
  }

  let paintCost = null;
  if (args.includes('--paint')) {
    const paintIdx = args.indexOf('--paint');
    paintCost = args[paintIdx + 1];
    if (isNaN(paintCost)) {
      console.error('❌ Error: El costo de pintura debe ser numérico.');
      process.exit(1);
    }
  }

  setTierPrice(data, tierKey, Number(newPrice), paintCost !== null ? Number(paintCost) : null);
  process.exit(0);
}

if (args.includes('--inflate')) {
  const inflIdx = args.indexOf('--inflate');
  const percent = args[inflIdx + 1];
  if (!percent || isNaN(percent)) {
    console.error('❌ Error: Debe ingresar el porcentaje numérico. Ej: node scripts/precios.js --inflate 10');
    process.exit(1);
  }
  inflateAll(data, Number(percent));
  process.exit(0);
}

showHelp();
