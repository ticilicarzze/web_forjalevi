# 💰 Forja Levi — Guía de Precios

## Ver tabla de precios actuales

```bash
node scripts/precios.js
```

---

## Cambiar el precio de un tier

```bash
node scripts/precios.js <tier> <precio_base> [costo_pintado]
```

### Ejemplos listos para copiar

```bash
# Héroes (Paladín, Mago, Bárbaro, Pícaro...)
node scripts/precios.js heroe 5000 10000

# Esbirros individuales (Goblins, Esqueletos, Kobolds...)
node scripts/precios.js esbirro 4000 2500

# Packs x5 de esbirros (Pack Goblins, Pack Esqueletos)
node scripts/precios.js pack-esbirros-x5 18000 25000

# Élites (Capitán espacial, Noble Orco, Campeones)
node scripts/precios.js elite 5000 5000

# Escuadrón Sci-Fi x5 (Tácticos, Asalto)
node scripts/precios.js escuadron-sci-fi-x5 11000 14000

# Monstruo mediano (Jinetes, Bestias, Corceles)
node scripts/precios.js monstruo-mediano 14000 12000

# Monstruo grande / Jefe (Dragones, Trolls)
node scripts/precios.js monstruo-grande 9500 15000

# Vehículo pesado (Dreadnought, Tanques, Walkers)
node scripts/precios.js vehiculo-pesado 16500 12000

# Torres de dados estándar
node scripts/precios.js torre-dados 20000

# Torres premium / Dragón / Cthulhu
node scripts/precios.js torre-dados-premium 40000

# Cajas de guardado y Mímicos
node scripts/precios.js caja-dados 11000

# Accesorios de mesa (Aros, Trackers, Marcadores)
node scripts/precios.js accesorio-mesa 4000
```

> Cada comando guarda el cambio en data/tiers.json y hace el deploy automático a Cloudflare Pages.

---

## Aumento porcentual masivo

```bash
# +10% a todos los tiers con deploy automático
node scripts/precios.js --inflate 10

# +20%
node scripts/precios.js --inflate 20
```

---

## Solo hacer deploy sin cambiar precios

```bash
node scripts/precios.js --deploy
```

---

## ¿Qué tier corresponde a cada producto?

| Tier                  | Productos                                                                  |
|-----------------------|----------------------------------------------------------------------------|
| heroe                 | Paladín, Mago Elfo, Bárbaro Enano, Pícaro Tiefling                        |
| esbirro               | Goblin Arquero, Esqueleto Guerrero (unidades sueltas)                      |
| pack-esbirros-x5      | Pack x5 Goblins, Pack x5 Esqueletos                                        |
| elite                 | Capitán Espacial, Noble Orco con Rebanadora                                |
| escuadron-sci-fi-x5   | Escuadrón Táctico x5                                                       |
| monstruo-mediano      | Caballero del Caos con Corcel Demoníaco                                    |
| monstruo-grande       | Dragón Joven Rojo                                                          |
| vehiculo-pesado       | Dreadnought de Combate Pesado                                              |
| torre-dados           | Torre Castillo, Torre Espiral, Torre Plegable, Torre Forja Enana           |
| torre-dados-premium   | Torre Cráneo de Dragón, Torre Cthulhu Tentáculos                          |
| caja-dados            | Mímico, Estuche Minis, Grimorio, Cofre, Caja Hexagonal, Maletín           |
| accesorio-mesa        | Aros de Condición, Tracker Vida, Bandeja, Spell Slots, Torre Iniciativa DM|
