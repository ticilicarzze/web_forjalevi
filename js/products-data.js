/**
 * FORJA LEVI — Catálogo de Productos y Modelo Canónico
 * Estructura de datos escalable para soporte de catálogo masivo,
 * variantes de producto (colores, escalas, acabados) y pasarelas de pago.
 */

const FORJA_CATALOG = [
  // ==================== MINIATURAS D&D ====================
  {
    id: "dnd-guerrero-dragonborn",
    name: "Guerrero Dragonborn con Mandoble",
    category: "miniaturas-dnd",
    basePrice: 3500,
    tags: ["Resina 8K", "Escala 32mm"],
    description: "Miniatura de alto detalle para bárbaro, paladín o guerrero.",
    variants: [
      { id: "dnd-dragonborn-32", name: "Escala 32mm", price: 3500 },
      { id: "dnd-dragonborn-75", name: "Escala 75mm (Exhibición)", price: 9500 }
    ]
  },
  {
    id: "dnd-mago-elfo",
    name: "Mago Elfo con Grimorio y Orbe",
    category: "miniaturas-dnd",
    basePrice: 3500,
    tags: ["Resina 8K", "Escala 32mm"],
    description: "Efectos translúcidos de conjuro esculpidos con máxima finura."
  },
  {
    id: "dnd-beholder-tirano",
    name: "Tirano Ocular / Beholder Cósmico",
    category: "miniaturas-dnd",
    basePrice: 12000,
    tags: ["Resina 8K", "Base 50mm"],
    description: "Criatura colosal con tentáculos oculares y base con estalagmitas."
  },

  // ==================== TORRES Y CAJAS ====================
  {
    id: "cg-mimico",
    name: "Caja Mímico Come-Dados",
    category: "torres-y-cajas",
    basePrice: 11000,
    tags: ["FDM + Resina", "Capacidad: 21 Dados"],
    description: "Tapa articulada con colmillos afilados y lengua esculpida. El guardián definitivo para tus dados.",
    variants: [
      {
        id: "cg-mimico-madera",
        name: "Madera Antigua & Bronce",
        price: 11000,
        colorHex: "#8b5a2b",
        badge: "Clásico"
      },
      {
        id: "cg-mimico-obsidiana",
        name: "Obsidiana & Ojos Carmesí",
        price: 12500,
        colorHex: "#2b1b3d",
        badge: "Mágico"
      },
      {
        id: "cg-mimico-oro",
        name: "Oro de la Forja & Dientes Marfil",
        price: 13000,
        colorHex: "#d4af37",
        badge: "Edición Forja"
      }
    ]
  },
  {
    id: "td-castillo-medieval",
    name: "Torre Castillo Medieval con Foso",
    category: "torres-y-cajas",
    basePrice: 14000,
    tags: ["FDM Premium", "20cm · Bandeja fija"],
    description: "Bafles internos escalonados para giros aleatorios perfectos y bandeja que retiene los dados.",
    variants: [
      { id: "td-castillo-gris", name: "Piedra Granito", price: 14000, colorHex: "#54595f" },
      { id: "td-castillo-cobre", name: "Cobre Envejecido", price: 15500, colorHex: "#b87333" }
    ]
  },
  {
    id: "td-craneo-dragon",
    name: "Torre Cráneo de Dragón",
    category: "torres-y-cajas",
    basePrice: 16500,
    tags: ["FDM / Resina", "22cm · Salida Mandíbula"],
    description: "Los dados entran por la corona craneal y ruedan a través de las fauces abiertas del dragón."
  },

  // ==================== PACKS & CAMPAÑAS ====================
  {
    id: "pack-10-minis",
    name: "Pack x10 Miniaturas (Iniciación)",
    category: "packs-y-campanas",
    basePrice: 30000,
    tags: ["Resina 8K", "10 Unidades"],
    description: "Ideal para tu party de aventureros (4-6 héroes) más sus primeros enemigos o PNJs clave."
  },
  {
    id: "pack-25-minis",
    name: "Pack x25 Miniaturas (Escaramuza)",
    category: "packs-y-campanas",
    basePrice: 68000,
    tags: ["Resina 8K", "25 Minis · Ahorro 20%"],
    description: "Excelente para dotar al Dungeon Master de esbirros variados o un pelotón táctico de wargames."
  },
  {
    id: "kit-campana-starter",
    name: "Kit Campaña Starter Set Completo",
    category: "packs-y-campanas",
    basePrice: 48000,
    tags: ["Resina 8K + FDM", "Kit DM Completo"],
    description: "Todo lo necesario para arrancar: 4 héroes a elección, 12 esbirros, 2 tenientes, 1 jefe y 4 piezas de escenografía."
  }
];

// Helper functions for catalog queries
function getProductById(id) {
  return FORJA_CATALOG.find(p => p.id === id) || null;
}

function getProductsByCategory(category) {
  return FORJA_CATALOG.filter(p => p.category === category);
}

// Global export for vanilla JS modules
if (typeof window !== 'undefined') {
  window.FORJA_CATALOG = FORJA_CATALOG;
  window.getProductById = getProductById;
  window.getProductsByCategory = getProductsByCategory;
}
