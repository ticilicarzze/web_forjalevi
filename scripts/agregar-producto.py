#!/usr/bin/env python3
"""
FORJA LEVI — Gestor interactivo para agregar productos al catálogo
===================================================================
Evita editar el JSON a mano. Simplemente responde las preguntas
y el script agregará el producto correctamente a data/products.json.

USO:
    npm run agregar
"""

import json
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
JSON_PATH = BASE_DIR / "data" / "products.json"

# Cargar JSON
try:
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
except Exception as e:
    print(f"❌ Error al leer products.json: {e}")
    sys.exit(1)

print("\n📦 [FORJA LEVI] Agregar Nuevo Producto")
print("───────────────────────────────────────────────────")

# 1. ID
id_prod = input("▶️ ID del producto (ej. wh-hellblaster-pose-1): ").strip()
if any(p.get("id") == id_prod for p in data.get("products", [])):
    print(f"⚠️ El ID '{id_prod}' ya existe. Intenta con otro.")
    sys.exit(1)

# 2. Nombre
name = input("▶️ Nombre (ej. Space Marine Hellblaster - Pose 1): ").strip()

# 3. Categoría
categories = [c["id"] for c in data.get("categories", [])]
print(f"\nCategorías disponibles: {', '.join(categories)}")
category = input("▶️ Categoría: ").strip()

# 3b. Subcategorías disponibles
selected_cat = next((c for c in data.get("categories", []) if c["id"] == category), None)
sub_cat = ""
sub_cat2 = ""

if selected_cat and selected_cat.get("subcategories"):
    sub_ids = [s["id"] for s in selected_cat["subcategories"]]
    print(f"\nSubcategorías disponibles: {', '.join(sub_ids)}")
    sub_cat = input("▶️ Subcategoría (opcional, Enter para omitir): ").strip()
    
    selected_sub = next((s for s in selected_cat["subcategories"] if s["id"] == sub_cat), None)
    if selected_sub and selected_sub.get("children"):
        child_ids = [ch["id"] for ch in selected_sub["children"]]
        print(f"\nOpciones específicas: {', '.join(child_ids)}")
        sub_cat2 = input("▶️ Sub-opción (opcional, Enter para omitir): ").strip()

# 4. Precio
while True:
    try:
        price = int(input("▶️ Precio Base (ej. 8000): ").strip())
        break
    except ValueError:
        print("⚠️ Ingresa solo números enteros.")

# 5. Descripción
description = input("▶️ Descripción breve: ").strip()

# 6. Imagen
image = input("▶️ Ruta de la imagen (ej. /assets/img/productos/foto.webp) [Enter para dejar vacío]: ").strip()

# 7. Tier y Pintado
print("\nTiers comunes: heroe, esbirro, elite, escuadron-sci-fi-x5, monstruo-mediano, vehiculo-pesado")
tier = input("▶️ Tier para pintar [Enter para 'elite']: ").strip() or "elite"

# Construir producto
new_product = {
    "id": id_prod,
    "name": name,
    "category": category,
    "price": price,
    "priceLabel": "Precio total:",
    "description": description,
    "tags": [
        {"text": "Resina 8K", "type": "resin"},
        {"text": "Escala 32mm", "type": "scale"}
    ],
    "image": image,
    "placeholderText": "Foto del Modelo",
    "icon": "mech",
    "painting": {
        "available": True,
        "cost": price, # El tier sobreescribirá esto si existe
        "label": "Pintado Tabletop"
    },
    "tier": tier
}

if sub_cat:
    new_product["subCategory"] = sub_cat
if sub_cat2:
    new_product["subCategory2"] = sub_cat2

data["products"].append(new_product)

# Guardar en data/products.json
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write("\n")

# Sincronizar en js/products-data.js
JS_PATH = BASE_DIR / "js" / "products-data.js"
try:
    js_content = f"""/**
 * FORJA LEVI — Catálogo de Productos y Modelo Canónico
 * Sincronizado automáticamente por scripts/agregar-producto.py
 */

window.FORJA_CATALOG_DATA = {json.dumps(data, indent=2, ensure_ascii=False)};
"""
    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)
    print("🔄 Sincronizado también en js/products-data.js")
except Exception as e:
    print(f"⚠️ No se pudo sincronizar js/products-data.js: {e}")

print("\n✅ ¡Producto agregado correctamente al catálogo!")
print(f"   ID: {id_prod} | Precio: ${price} | Categoría: {category}")
print("   No olvides ejecutar 'npm run dev' o actualizar tu navegador si ya está corriendo.")
print("───────────────────────────────────────────────────\n")
