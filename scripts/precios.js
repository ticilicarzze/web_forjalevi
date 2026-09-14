#!/usr/bin/env node
/**
 * FORJA LEVI — Gestor de Precios
 * ================================
 * Edita data/tiers.json y sube automáticamente a Cloudflare Pages.
 *
 * USO:
 *   node scripts/precios.js                         → Ver todos los tiers y precios actuales
 *   node scripts/precios.js heroe 5000              → Cambia precio base de héroes
 *   node scripts/precios.js heroe 5000 10000        → Cambia base y pintado
 *   node scripts/precios.js esbirro 4000 2500       → Goblins, Esqueletos, etc.
 *   node scripts/precios.js --inflate 10            → +10% a todos, redondeado a $100
 *   node scripts/precios.js --deploy                → Sube cambios a Cloudflare sin cambiar precios
 */

const fs    = require('fs');
const path  = require('path');
const { execSync } = require('child_process');

const TIERS_PATH = path.resolve(__dirname, '../data/tiers.json');

function load() { return JSON.parse(fs.readFileSync(TIERS_PATH, 'utf8')); }
function save(t) { fs.writeFileSync(TIERS_PATH, JSON.stringify(t, null, 2) + '\n'); }
function ar(n) { return '$' + Number(n || 0).toLocaleString('es-AR'); }

function list(tiers) {
  console.log('\n  TIER                 PRECIO BASE   PINTADO');
  console.log('  ─────────────────────────────────────────────');
  for (const [k, v] of Object.entries(tiers)) {
    const paint = v.paint != null ? ar(v.paint) : '—';
    console.log(`  ${k.padEnd(21)} ${ar(v.price).padEnd(14)} ${paint}`);
  }
  console.log();
}

function deploy() {
  console.log('\n🚀 Subiendo cambios a Cloudflare Pages...');
  try {
    execSync('git add data/tiers.json data/products.json js/products-data.js package.json', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    execSync('git commit -m "update: precios actualizados"', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    execSync('git push origin main', { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log('✅ Publicado en Cloudflare Pages.\n');
  } catch (e) {
    if (e.message && e.message.includes('nothing to commit')) {
      console.log('ℹ️  No hay cambios nuevos para subir.\n');
    } else {
      throw e;
    }
  }
}

const args = process.argv.slice(2);
const tiers = load();

// No args → show table
if (args.length === 0) { list(tiers); process.exit(0); }

// --deploy only
if (args[0] === '--deploy') { deploy(); process.exit(0); }

// --inflate <pct>
if (args[0] === '--inflate') {
  const pct = parseFloat(args[1]);
  if (isNaN(pct)) { console.error('Uso: node scripts/precios.js --inflate 10'); process.exit(1); }
  for (const t of Object.values(tiers)) {
    t.price = Math.round(t.price * (1 + pct / 100) / 100) * 100;
    if (t.paint != null) t.paint = Math.round(t.paint * (1 + pct / 100) / 100) * 100;
  }
  save(tiers);
  console.log(`\n✅ Aumento del ${pct}% aplicado a todos los tiers.\n`);
  list(tiers);
  deploy();
  process.exit(0);
}

// <tier> <precio> [pintado]
const [tierKey, priceStr, paintStr] = args;
if (!tiers[tierKey]) {
  console.error(`\n❌ Tier "${tierKey}" no existe. Tiers disponibles:\n`);
  list(tiers);
  process.exit(1);
}
if (isNaN(parseFloat(priceStr))) {
  console.error('Uso: node scripts/precios.js <tier> <precio> [pintado]');
  process.exit(1);
}

const prev = { ...tiers[tierKey] };
tiers[tierKey].price = parseFloat(priceStr);
if (paintStr && !isNaN(parseFloat(paintStr))) tiers[tierKey].paint = parseFloat(paintStr);
save(tiers);

console.log(`\n✅ Tier "${tierKey}" actualizado:`);
console.log(`   Precio:  ${ar(prev.price)} → ${ar(tiers[tierKey].price)}`);
if (prev.paint != null || tiers[tierKey].paint != null) {
  console.log(`   Pintado: ${ar(prev.paint)} → ${ar(tiers[tierKey].paint)}`);
}
console.log();
deploy();
