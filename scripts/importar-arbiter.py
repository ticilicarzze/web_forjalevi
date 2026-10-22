#!/usr/bin/env python3
"""
FORJA LEVI — Importador de Miniaturas Supportless de Arbiter Miniatures
======================================================================
Descarga y optimiza las imágenes a formato WebP (800x800) en assets/img/productos,
clasifica cada modelo en su categoría y subcategoría correspondiente,
asigna el tier adecuado y lo registra en data/products.json y js/products-data.js.
"""

import os
import sys
import json
import re
import io
import time
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from PIL import Image

BASE_DIR = Path(__file__).resolve().parent.parent
PRODUCTS_JSON_PATH = BASE_DIR / "data" / "products.json"
TIERS_JSON_PATH = BASE_DIR / "data" / "tiers.json"
PRODUCTS_JS_PATH = BASE_DIR / "js" / "products-data.js"
IMG_OUT_DIR = BASE_DIR / "assets" / "img" / "productos"

IMG_OUT_DIR.mkdir(parents=True, exist_ok=True)

# 1. Cargar metadatos descargados
with open("/tmp/arbiter_all_237.json", "r", encoding="utf-8") as f:
    raw_products = json.load(f)

print(f"📦 Total productos crudos a procesar: {len(raw_products)}")

# Función para generar slug limpio
def make_slug(name):
    s = re.sub(r'arbiter miniatures', '', name, flags=re.I)
    s = re.sub(r'supportless', '', s, flags=re.I)
    s = re.sub(r'patreon', '', s, flags=re.I)
    s = re.sub(r'\b(january|february|march|april|may|june|july|august|september|october|november|december)\b', '', s, flags=re.I)
    s = re.sub(r'\b202[0-9]\b', '', s)
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s

# Clasificación
def classify(name):
    n = name.lower()
    is_pack = any(k in n for k in [
        'warband', 'part 1+2', 'part 1-2', 'full set', 'part 1', 'part 2',
        'dragon kin', 'wizards of the realm', 'mighty ogres', 'warrior priests',
        'hill trolls', 'eldritch horrors', 'mephit elementals', 'dueling knights'
    ])
    
    if is_pack:
        tier = 'pack-esbirros-x5'
        icon = 'pack'
        if 'goblin' in n: return 'esbirros', 'goblins', tier, icon, True
        if 'kobold' in n: return 'esbirros', 'kobolds', tier, icon, True
        if 'ogre' in n or 'troll' in n: return 'monstruos', 'gigantes', tier, icon, True
        if 'dragon' in n: return 'monstruos', 'dragones', tier, icon, True
        if 'eldritch' in n or 'horror' in n: return 'monstruos', 'aberraciones', tier, icon, True
        if 'elemental' in n or 'mephit' in n: return 'monstruos', 'elementales', tier, icon, True
        if 'wizard' in n: return 'heroes', 'mago', tier, icon, True
        if 'priest' in n: return 'heroes', 'clerigo', tier, icon, True
        return 'heroes', 'guerrero', tier, icon, True

    # Esbirros / specific monsters first
    if 'skeleton' in n or 'bone serpent' in n: return 'esbirros', 'esqueletos', 'esbirro', 'axe', False
    if 'zombie' in n or 'ghoul' in n: return 'esbirros', 'zombis', 'esbirro', 'shield', False
    if 'ork' in n or 'orc' in n: return 'esbirros', 'orcos', 'esbirro', 'axe', False
    if 'goblin' in n: return 'esbirros', 'goblins', 'esbirro', 'dagger', False
    if 'kobold' in n: return 'esbirros', 'kobolds', 'esbirro', 'dagger', False
    if 'bandit' in n or 'cultist' in n: return 'esbirros', 'bandidos', 'esbirro', 'dagger', False
    if 'rat' in n: return 'esbirros', 'hombres-rata', 'esbirro', 'dagger', False

    # Monstruos
    if 'vampire' in n or 'undead' in n or 'wight' in n or 'lich' in n or 'reaver' in n:
        return 'monstruos', 'no-muertos-mayores', 'monstruo-mediano', 'shield', False
    if 'ogre' in n or 'troll' in n or 'giant' in n:
        return 'monstruos', 'gigantes', 'monstruo-mediano', 'axe', False
    if 'dragon' in n:
        return 'monstruos', 'dragones', 'monstruo-mediano', 'dragon', False
    if 'aboleth' in n or 'mimic' in n or 'horror' in n:
        return 'monstruos', 'aberraciones', 'monstruo-mediano', 'box', False
    if 'wolf' in n or 'bear' in n or 'beast' in n:
        return 'monstruos', 'bestias', 'esbirro', 'dagger', False
    if 'elemental' in n or 'mephit' in n:
        return 'monstruos', 'elementales', 'esbirro', 'sparkles', False
    if 'demon' in n or 'devil' in n:
        return 'monstruos', 'demonios', 'monstruo-mediano', 'shield', False

    # Heroes
    if 'priest' in n or 'cleric' in n: return 'heroes', 'clerigo', 'heroe', 'shield', False
    if 'paladin' in n: return 'heroes', 'paladin', 'heroe', 'shield', False
    if 'wizard' in n or 'mage' in n or 'sorcerer' in n: return 'heroes', 'mago', 'heroe', 'sparkles', False
    if 'druid' in n: return 'heroes', 'druida', 'heroe', 'sparkles', False
    if 'bard' in n: return 'heroes', 'bardo', 'heroe', 'sparkles', False
    if 'barbarian' in n or 'berserker' in n: return 'heroes', 'barbaro', 'heroe', 'axe', False
    if 'thief' in n or 'rogue' in n or 'assassin' in n: return 'heroes', 'picaro', 'heroe', 'dagger', False
    if 'ranger' in n or 'archer' in n or 'hunter' in n: return 'heroes', 'explorador', 'heroe', 'target', False
    if 'demonkin' in n or 'warlock' in n: return 'heroes', 'brujo', 'heroe', 'sparkles', False
    if 'monk' in n: return 'heroes', 'monje', 'heroe', 'shield', False
    if 'rifleman' in n or 'blacksmith' in n: return 'heroes', 'artificiero', 'heroe', 'shield', False

    return 'heroes', 'guerrero', 'heroe', 'shield', False

# Limpieza y traducción de títulos
def translate_title(name):
    s = name.strip()
    s = re.sub(r'^Arbiter Miniatures\s*', '', s, flags=re.I)
    s = re.sub(r'^Patreon\s*', '', s, flags=re.I)
    s = re.sub(r'^(January|February|March|April|May|June|July|August|September|October|November|December)\s+202[0-9]\s*', '', s, flags=re.I)
    s = re.sub(r'^Kickstarter\s+[0-9]+:?\s*', '', s, flags=re.I)
    s = re.sub(r'Supportless\s*', '', s, flags=re.I)
    s = re.sub(r'\s*Supportless$', '', s, flags=re.I)
    s = re.sub(r'\s*,\s*$', '', s)
    s = s.strip()

    pose_suffix = ""
    m = re.search(r'\s+0?([1-9][0-9]?)$', s)
    if m:
        num = int(m.group(1))
        pose_suffix = f" (Pose {num:02d})"
        s = s[:m.start()].strip()

    translations = [
        (r'\bGoblin Warband Part 2\b', 'Banda Goblin Warband (Parte 2)'),
        (r'\bGoblin Warband\b', 'Banda Goblin Warband'),
        (r'\bEldritch Horrors\b', 'Pack Horrores Cósmicos Eldritch'),
        (r'\bKobolds Part 1\+2\b', 'Pack Horda de Kobolds (Partes 1 y 2)'),
        (r'\bKobolds Part 1-2\b', 'Pack Horda de Kobolds (Partes 1 y 2)'),
        (r'\bDragon Kin\b', 'Pack Hombres Dragón (Dragonkin)'),
        (r'\bWizards of the Realm\b', 'Pack Magos del Reino'),
        (r'\bMighty Ogres\b', 'Pack Ogros Salvajes Poderosos'),
        (r'\bMephit Elementals\b', 'Pack Mefitas y Elementales'),
        (r'\bWarrior Priests\b', 'Pack Clérigos Guerreros'),
        (r'\bHill Trolls\b', 'Pack Trolls de las Colinas'),
        (r'\bDueling Knights\b', 'Set Caballeros en Duelo'),
        (r'\bAboleth Monstrosity\b', 'Aboleth — Monstruosidad Aberrante'),
        (r'\bDice tower, Dwarf Blacksmith\b', 'Torre de Dados Herrero Enano'),
        (r'\bStand with King & Queen\b', 'Trono con Rey y Reina'),
        (r'\bBust, Knight\b', 'Busto de Caballero'),
        (r'\bWarrior Priest Male\b', 'Clérigo Guerrero'),
        (r'\bWarrior Priest Female\b', 'Clériga Guerrera'),
        (r'\bWarrior Priest\b', 'Clérigo Guerrero'),
        (r'\bVampire Transfigured\b', 'Vampiro Transfigurado'),
        (r'\bVampire Night Shrieker\b', 'Vampiro Chillador Nocturno'),
        (r'\bVampire Male\b', 'Vampiro Noble'),
        (r'\bVampire Lord\b', 'Señor Vampiro (Vampire Lord)'),
        (r'\bVampire Hunter Male\b', 'Cazador de Vampiros'),
        (r'\bVampire Hunter Female\b', 'Cazadora de Vampiros'),
        (r'\bUndead God\b', 'Dios No-Muerto'),
        (r'\bBone Serpent\b', 'Serpiente de Huesos'),
        (r'\bDread Wolf\b', 'Lobo Espectral'),
        (r'\bFemale Knight on Horse Frogmouth helmet\b', 'Caballera a Caballo con Yelmo'),
        (r'\bKnight on Horse Frogmouth helmet\b', 'Caballero a Caballo con Yelmo'),
        (r'\bFemale Knight on Horse\b', 'Caballera a Caballo'),
        (r'\bKnight on Horse\b', 'Caballero a Caballo'),
        (r'\bFemale Knight\b', 'Caballera Acorazada'),
        (r'\bKnight\b', 'Caballero'),
        (r'\bDwarf Dark Knight\b', 'Enano Caballero Oscuro'),
        (r'\bDwarf Blacksmith\b', 'Enano Herrero'),
        (r'\bDwarf Rifleman\b', 'Enano Tirador con Arcabuz'),
        (r'\bDwarf Male Archer\b', 'Enano Arquero'),
        (r'\bDwarf Female Archer\b', 'Enana Arquera'),
        (r'\bSkeleton Axe\b', 'Esqueleto con Hacha'),
        (r'\bSkeleton Spear\b', 'Esqueleto con Lanza'),
        (r'\bSkeleton Sword\b', 'Esqueleto con Espada'),
        (r'\bSkeleton Bow\b', 'Esqueleto Arquero'),
        (r'\bSkeleton Knight\b', 'Esqueleto Caballero'),
        (r'\bSkeleton Chainballer\b', 'Esqueleto con Cadena y Bola'),
        (r'\bSkeleton\b', 'Esqueleto Guerrero'),
        (r'\bOrk Female Berserker\b', 'Orca Berserker'),
        (r'\bOrk Male Berserker\b', 'Orco Berserker'),
        (r'\bOrk Bomber\b', 'Orco Bombardero'),
        (r'\bOrk Warboy\b', 'Orco Chico de Guerra'),
        (r'\bOrk Axe\b', 'Orco con Hacha'),
        (r'\bOrk Spear\b', 'Orco con Lanza'),
        (r'\bOrk Bow\b', 'Orco con Arco'),
        (r'\bOrk Club\b', 'Orco con Garrote'),
        (r'\bOrk\b', 'Orco'),
        (r'\bHalf Orc Male\b', 'Semi-Orco Aventurero'),
        (r'\bHalf Orc Female\b', 'Semi-Orca Aventurera'),
        (r'\bGoblin Captain\b', 'Capitán Goblin'),
        (r'\bGoblin\b', 'Goblin'),
        (r'\bKobold\b', 'Kobold'),
        (r'\bOgre\b', 'Ogro de las Cavernas'),
        (r'\bTroll\b', 'Troll'),
        (r'\bTraining Dummy\b', 'Maniquí de Entrenamiento'),
        (r'\bMage Male\b', 'Mago Arcano'),
        (r'\bMage Female\b', 'Maga Arcana'),
        (r'\bFighter Male\b', 'Guerrero'),
        (r'\bFighter Female\b', 'Guerrera'),
        (r'\bPaladin Male\b', 'Paladín Sagrado'),
        (r'\bPaladin Female\b', 'Paladinesa Sagrada'),
        (r'\bThief Male\b', 'Pícaro Furtivo'),
        (r'\bThief Female\b', 'Pícara Furtiva'),
        (r'\bBarbarian Male\b', 'Bárbaro del Norte'),
        (r'\bBarbarian Female\b', 'Bárbara del Norte'),
        (r'\bBard Male\b', 'Bardo Trovador'),
        (r'\bBard Female\b', 'Barda Trovadora'),
        (r'\bCleric Male\b', 'Clérigo Sanador'),
        (r'\bCleric Female\b', 'Clériga Sanadora'),
        (r'\bDemonkin Male\b', 'Tiefling / Demoniaco'),
        (r'\bDemonkin Female\b', 'Tiefling / Demoniaca'),
        (r'\bDruid Male\b', 'Druida del Bosque'),
        (r'\bDruid Female\b', 'Druida de la Naturaleza'),
        (r'\bMonk Male\b', 'Monje Marcial'),
        (r'\bMonk Female\b', 'Monja Marcial'),
        (r'\bZombie\b', 'Zombi Putrefacto'),
        (r'\bReaver\b', 'Segador Siniestro'),
        (r'\bGuard\b', 'Guardia de la Ciudad')
    ]

    for pat, rep in translations:
        if re.search(pat, s, flags=re.I):
            s = re.sub(pat, rep, s, flags=re.I)
            break

    return f"{s}{pose_suffix}".strip()

# Descarga de imagen
def download_image(p):
    slug = make_slug(p["name"])
    prod_id = f"dnd-arbiter-{slug}"
    out_file = IMG_OUT_DIR / f"{prod_id}.webp"

    if out_file.exists() and out_file.stat().st_size > 1000:
        return prod_id, str(out_file.relative_to(BASE_DIR)), True

    raw_url = p.get("obj_original_img") or p.get("obj_img")
    if not raw_url:
        return prod_id, "", False

    parts = urllib.parse.urlsplit(raw_url)
    clean_path = urllib.parse.quote(parts.path)
    encoded = urllib.parse.urlunsplit((parts.scheme, parts.netloc, clean_path, parts.query, parts.fragment))
    proxy_url = f"https://images2.myminifactory.com/insecure/rt:fill-down/w:800/h:800/el:1/plain/{encoded}"

    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://www.myminifactory.com/",
        "Accept": "image/webp,image/jpeg,*/*"
    }

    try:
        req = urllib.request.Request(proxy_url, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()

        im = Image.open(io.BytesIO(data)).convert("RGB")
        im.save(out_file, "WEBP", quality=82)
        return prod_id, str(out_file.relative_to(BASE_DIR)), True
    except Exception as e:
        # Fallback to direct raw_url
        try:
            req2 = urllib.request.Request(encoded, headers=headers)
            with urllib.request.urlopen(req2, timeout=15) as resp:
                data2 = resp.read()
            im2 = Image.open(io.BytesIO(data2)).convert("RGB")
            im2.save(out_file, "WEBP", quality=82)
            return prod_id, str(out_file.relative_to(BASE_DIR)), True
        except Exception as e2:
            print(f"❌ Error descargando {prod_id}: {e2}")
            return prod_id, "", False

print("🚀 Iniciando descarga paralela de imágenes (12 hilos)...")
t0 = time.time()
image_results = {}

with ThreadPoolExecutor(max_workers=12) as executor:
    futures = {executor.submit(download_image, p): p for p in raw_products}
    done_count = 0
    for future in as_completed(futures):
        pid, path, ok = future.result()
        image_results[pid] = path
        done_count += 1
        if done_count % 25 == 0 or done_count == len(raw_products):
            print(f"  [{done_count}/{len(raw_products)}] imágenes procesadas...")

print(f"✅ Descarga completada en {time.time()-t0:.1f}s.")

# Cargar catálogo actual y tiers
with open(PRODUCTS_JSON_PATH, "r", encoding="utf-8") as f:
    catalog_data = json.load(f)

with open(TIERS_JSON_PATH, "r", encoding="utf-8") as f:
    tiers_data = json.load(f)

existing_products = catalog_data.get("products", [])
existing_ids = {p["id"] for p in existing_products}

new_products = []
for p in raw_products:
    slug = make_slug(p["name"])
    prod_id = f"dnd-arbiter-{slug}"

    if prod_id in existing_ids:
        continue

    spanish_name = translate_title(p["name"])
    sub1, sub2, tier, icon, is_pack = classify(p["name"])

    tier_info = tiers_data.get(tier, {"price": 5000, "paint": 10000})
    base_price = tier_info.get("price", 5000)
    paint_cost = tier_info.get("paint", 5000)

    if is_pack:
        desc = f"Set completo de miniaturas supportless diseñado por Arbiter Miniatures. Impresión en filamento FDM sin soportes o en resina 8K con máximo nivel de detalle para tu mesa de rol."
        tags = [
            {"text": "Supportless FDM", "type": "fdm"},
            {"text": "Pack Miniaturas", "type": "scale"}
        ]
    else:
        desc = f"Miniatura supportless diseñada por Arbiter Miniatures. Impresión en filamento FDM sin soportes o resina 8K de ultra alta definición. Base 25/32mm lista para jugar y pintar."
        tags = [
            {"text": "Supportless FDM", "type": "fdm"},
            {"text": "Resina 8K", "type": "resin"},
            {"text": "Escala 32mm", "type": "scale"}
        ]

    prod_obj = {
        "id": prod_id,
        "name": spanish_name,
        "category": "miniaturas-dnd",
        "subCategory": sub1,
        "subCategory2": sub2,
        "price": base_price,
        "priceLabel": "Precio total:",
        "description": desc,
        "tags": tags,
        "image": image_results.get(prod_id, ""),
        "placeholderText": "Foto del Modelo",
        "icon": icon,
        "painting": {
            "available": True,
            "cost": paint_cost,
            "label": "Pintado Tabletop"
        },
        "tier": tier
    }
    new_products.append(prod_obj)
    existing_ids.add(prod_id)

print(f"\n📋 Nuevos productos a incorporar al catálogo: {len(new_products)}")
catalog_data["products"].extend(new_products)

# Guardar data/products.json
with open(PRODUCTS_JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(catalog_data, f, indent=2, ensure_ascii=False)
    f.write("\n")
print("💾 data/products.json actualizado.")

# Guardar js/products-data.js
catalog_data["tiers"] = tiers_data
js_content = f"""/**
 * FORJA LEVI — Catálogo de Productos y Tiers
 * ===========================================
 * Generado automáticamente. NO EDITAR A MANO.
 * Para actualizar precios: node scripts/precios.js
 */

const FORJA_CATALOG_DATA = {json.dumps(catalog_data, indent=2, ensure_ascii=False)};

const FORJA_PRODUCTS_DATA = FORJA_CATALOG_DATA.products;

if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{ FORJA_CATALOG_DATA, FORJA_PRODUCTS_DATA }};
}}
"""

with open(PRODUCTS_JS_PATH, "w", encoding="utf-8") as f:
    f.write(js_content)
print("💾 js/products-data.js sincronizado.")

print("\n🎉 ¡Importación finalizada con éxito!")
