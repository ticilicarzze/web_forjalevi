#!/usr/bin/env python3
"""
FORJA LEVI — Optimizador Automático de Fotos de Productos
=========================================================
Toma fotos sacadas con celular o cámara (JPG, PNG, HEIF/HEIC de iPhone o sin extensión),
corrige la rotación (EXIF), las redimensiona al tamaño ideal para web
y las convierte a WebP comprimido (de 2MB bajan a ~40-70 KB sin pérdida visible).

USO:
    npm run fotos
    o: python3 scripts/optimizar-fotos.py
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageOps

# Registrar soporte HEIF/HEIC (formato nativo de fotos de iPhone)
try:
    import pillow_heif
    pillow_heif.register_heif_opener()
except ImportError:
    pass

BASE_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = BASE_DIR / "assets" / "img" / "raw"
OUTPUT_DIR = BASE_DIR / "assets" / "img" / "productos"

MAX_SIZE = (900, 900)  # Tamaño máximo para nitidez en pantallas Retina
QUALITY = 82           # Calidad WebP balanceada (óptima entre peso y nitidez)
VALID_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".heic", ".heif", ""}

def format_bytes(size):
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{size / 1024:.1f} KB"
    else:
        return f"{size / (1024 * 1024):.2f} MB"

def is_image_file(path: Path) -> bool:
    if path.name.startswith(".") or path.is_dir():
        return False
    # Si tiene extensión válida conocida
    if path.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".heic", ".heif"}:
        return True
    # Si no tiene extensión, intentar ver si Pillow lo reconoce como imagen
    try:
        with Image.open(path) as img:
            return True
    except Exception:
        return False

def optimize_images():
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    files = [f for f in sorted(RAW_DIR.iterdir()) if is_image_file(f)]

    if not files:
        print("\n📸 [FORJA LEVI] Optimizador de Fotos de Productos")
        print("───────────────────────────────────────────────────")
        print(f"ℹ️  No hay fotos para optimizar en: {RAW_DIR.relative_to(BASE_DIR)}/")
        print("\n👉 CÓMO USAR:")
        print("1. Copia o arrastra tus fotos (JPG, PNG, HEIC de iPhone o sin extensión) en:")
        print("   assets/img/raw/")
        print("2. Ejecuta nuevamente:")
        print("   npm run fotos")
        print("3. Las fotos optimizadas quedarán en assets/img/productos/ en formato .webp!\n")
        return

    print("\n📸 [FORJA LEVI] Optimizando fotos...")
    print("───────────────────────────────────────────────────")

    total_original = 0
    total_optimized = 0
    results = []

    for file_path in files:
        original_size = file_path.stat().st_size
        total_original += original_size

        stem = file_path.stem.lower().replace(" ", "-")
        out_path = OUTPUT_DIR / f"{stem}.webp"

        try:
            with Image.open(file_path) as im:
                # Corregir orientación del sensor del celular (datos EXIF)
                im = ImageOps.exif_transpose(im)

                # Mantener canal alfa si es PNG con transparencia, o pasar a RGB
                if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
                    pass
                else:
                    im = im.convert("RGB")

                # Redimensionar si supera el tamaño máximo
                im.thumbnail(MAX_SIZE, Image.Resampling.LANCZOS)

                # Guardar en WebP
                im.save(out_path, "WEBP", quality=QUALITY, method=6)

            new_size = out_path.stat().st_size
            total_optimized += new_size
            reduction = (1 - (new_size / original_size)) * 100 if original_size > 0 else 0

            print(f"✅ {file_path.name}")
            print(f"   {format_bytes(original_size)} ➔ {format_bytes(new_size)} (-{reduction:.1f}%)")
            print(f"   Destino: /assets/img/productos/{out_path.name}")
            print()
            results.append((file_path.name, out_path.name))

        except Exception as e:
            print(f"❌ Error al procesar {file_path.name}: {e}\n")

    ahorro_total = total_original - total_optimized
    pct_total = (1 - (total_optimized / total_original)) * 100 if total_original > 0 else 0

    print("───────────────────────────────────────────────────")
    print(f"🎉 ¡Listo! Procesadas {len(results)} fotos.")
    print(f"   Peso original total:   {format_bytes(total_original)}")
    print(f"   Peso optimizado total: {format_bytes(total_optimized)}")
    print(f"   Espacio ahorrado:      {format_bytes(ahorro_total)} (-{pct_total:.1f}%)\n")
    print("💡 Rutas listas para usar en data/products.json:")
    for orig, dest in results:
        print(f'   "{orig}" ➔ "image": "/assets/img/productos/{dest}"')
    print()

if __name__ == "__main__":
    optimize_images()
