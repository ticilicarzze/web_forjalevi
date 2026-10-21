#!/usr/bin/env python3
"""
FORJA LEVI — Procesamiento y Registro de Nuevas Fotos FDM
=========================================================
Convierte las 82 fotos HEIC a WebP optimizado con sus nuevos nombres/IDs,
y agrega automáticamente cada producto a data/products.json y js/products-data.js.
"""

import json
import os
import sys
from pathlib import Path
import pillow_heif
from PIL import Image, ImageOps

pillow_heif.register_heif_opener()

BASE_DIR = Path(__file__).resolve().parent.parent
FOTOS_DIR = BASE_DIR / "assets" / "img" / "productos" / "Fotos-20261020T234044Z-1-001" / "Fotos"
OUT_IMG_DIR = BASE_DIR / "assets" / "img" / "productos"
JSON_PATH = BASE_DIR / "data" / "products.json"
JS_PATH = BASE_DIR / "js" / "products-data.js"
TIERS_PATH = BASE_DIR / "data" / "tiers.json"

with open(TIERS_PATH, "r", encoding="utf-8") as f:
    tiers = json.load(f)

MAPPING = {
    'dnd-fdm-mimics.HEIC': {
        'id': 'dnd-fdm-mimicos',
        'name': 'Trío de Mímicos de Cofre',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Pack de 3 cofres mímicos con fauces abiertas y lenguas monstruosas. Impresión en filamento FDM resistente.',
        'icon': 'box',
        'tag_scale': 'Pack x3 Minis'
    },
    'dnd-fdm-rata.HEIC': {
        'id': 'dnd-fdm-rata-gigante',
        'name': 'Rata Gigante de Cloaca',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Rata gigante feroz con cola prensil y colmillos prominentes. Ideal para encuentros iniciales y alcantarillas.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'dnd-fdm-lobo.HEIC': {
        'id': 'dnd-fdm-lobo-huargo',
        'name': 'Lobo Huargo de Caza',
        'tier': 'esbirro',
        'subCategory': 'monstruos',
        'desc': 'Lobo salvaje corpulento listo para abalanzarse sobre los aventureros. Gran detalle en pelaje.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'dnd-fdm-espectro.HEIC': {
        'id': 'dnd-fdm-espectro-brazos',
        'name': 'Aparición Espectral (Brazos Abiertos)',
        'tier': 'esbirro',
        'subCategory': 'monstruos',
        'desc': 'Espíritu incorpóreo flotante con túnica andrajosa y brazos extendidos buscando almas.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'dnd-fdm-espectro2.HEIC': {
        'id': 'dnd-fdm-espectro-tomo',
        'name': 'Aparición Espectral (Guardián del Tomo)',
        'tier': 'esbirro',
        'subCategory': 'monstruos',
        'desc': 'Espectro maldito protegiendo un grimorio arcano con su presencia gélida.',
        'icon': 'book',
        'tag_scale': 'Escala 32mm'
    },
    'dnd-fdm-bullete.HEIC': {
        'id': 'dnd-fdm-bulette',
        'name': 'Bulette — Tiburón de Tierra',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Temible devorador subterráneo acorazado con placas óseas y garras excavadoras.',
        'icon': 'dragon',
        'tag_scale': 'Gran Tamaño'
    },
    'dnd-fdm-gigantemasivo.HEIC': {
        'id': 'dnd-fdm-gigante-colinas',
        'name': 'Gigante de las Colinas con Espadón',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Colosal gigante guerrero con armadura de cuero y un espadón gigante apoyado en el hombro.',
        'icon': 'knight',
        'tag_scale': 'Colosal'
    },
    'dnd-fdm-kraken.HEIC': {
        'id': 'dnd-fdm-kraken-tentaculos',
        'name': 'Kraken Marino & Tentáculos Emergentes',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Horror marino colosal con cabeza de leviatán y múltiples tentáculos brotando de la superficie.',
        'icon': 'dragon',
        'tag_scale': 'Set Escénico'
    },
    'dnd-fdm-troll1.HEIC': {
        'id': 'dnd-fdm-troll-caverna',
        'name': 'Troll de Caverna con Garrote',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Troll de complexión masiva con garrote de madera tosca en pose amenazante.',
        'icon': 'knight',
        'tag_scale': 'Mediano'
    },
    'dnd-fdm-troll2.HEIC': {
        'id': 'dnd-fdm-troll-furioso',
        'name': 'Troll Furioso Lanzador de Troncos',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Troll salvaje levantando un pesado tronco sobre su cabeza en ataque destructor.',
        'icon': 'knight',
        'tag_scale': 'Mediano'
    },
    'dnd-fdm-ogro1.HEIC': {
        'id': 'dnd-fdm-ogro-aplastador',
        'name': 'Ogro Salvaje Aplastador',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Bruto gigante con fuerza demoledora y barriga prominente, listo para embestir.',
        'icon': 'shield',
        'tag_scale': 'Mediano'
    },
    'dnd-fdm-ogro2.HEIC': {
        'id': 'dnd-fdm-ogro-berserker',
        'name': 'Ogro Berserker de las Montañas',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Ogro con postura encorvada y puños de roca endurecida preparado para el combate.',
        'icon': 'shield',
        'tag_scale': 'Mediano'
    },
    'dnd-fdm-glutonny.HEIC': {
        'id': 'dnd-fdm-demonio-gula',
        'name': 'Demonio Abisal de la Gula',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Monstruosidad de las profundidades con una enorme boca voraz llena de colmillos en el torso.',
        'icon': 'dragon',
        'tag_scale': 'Mediano'
    },
    'IMG_4439.HEIC': {
        'id': 'dnd-fdm-beholder-caverna',
        'name': 'Beholder — Ojo Tirano de las Profundidades',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Aberración esférica clásica de D&D con múltiples pedúnculos oculares y fauces aterradoras.',
        'icon': 'dragon',
        'tag_scale': 'Gran Tamaño'
    },
    'IMG_4440.HEIC': {
        'id': 'dnd-fdm-mercader-trotamundos',
        'name': 'Trotamundos & Mercader Ambulante',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Comerciante itinerante cargando un voluminoso saco de provisiones y tesoros exóticos.',
        'icon': 'pack',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4441.HEIC': {
        'id': 'dnd-fdm-elemental-tierra',
        'name': 'Elemental de Tierra Rocoso',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Espíritu de la roca sólida formado por peñascos afilados y pinzas demoledoras.',
        'icon': 'shield',
        'tag_scale': 'Mediano'
    },
    'IMG_4442.HEIC': {
        'id': 'dnd-fdm-ogro-cargador-pilar-1',
        'name': 'Ogro Cargador de Pilares (Pose 1)',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Colosal ogro cantero cargando un monumental pilar de piedra tallada como arma contundente.',
        'icon': 'knight',
        'tag_scale': 'Gran Tamaño'
    },
    'IMG_4443.HEIC': {
        'id': 'dnd-fdm-ogro-cargador-pilar-2',
        'name': 'Ogro Cargador de Pilares (Pose 2)',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Segunda pose del ogro portador del monolito de piedra ancestral, vista frontal.',
        'icon': 'knight',
        'tag_scale': 'Gran Tamaño'
    },
    'IMG_4444.HEIC': {
        'id': 'dnd-fdm-oso-polar-batalla',
        'name': 'Oso Gigante de Batalla',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Poderoso plantígrado de las tundras heladas, excelente como montura o bestia de asalto.',
        'icon': 'dagger',
        'tag_scale': 'Mediano'
    },
    'IMG_4445.HEIC': {
        'id': 'dnd-fdm-brujo-tiefling-orbe',
        'name': 'Brujo Tiefling con Báculo de Orbe',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Lanzador de conjuros con cuernos rituales y báculo coronado por una esfera mística.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4446.HEIC': {
        'id': 'dnd-fdm-gargola-alada',
        'name': 'Gárgola Alada de Piedra',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Constructo alado de catedral con garras afiladas y alas membranosas desplegadas.',
        'icon': 'dragon',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4447.HEIC': {
        'id': 'dnd-fdm-monje-guerrero-lanza',
        'name': 'Monje Guerrero con Lanza de Asedio',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Combatiente marcial disciplinado en guardia con asta de combate ligera.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4448.HEIC': {
        'id': 'dnd-fdm-explorador-roca-vigia',
        'name': 'Explorador Elfo en Roca Vigía',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guardián forestal oteando el horizonte subido a una roca de vigilancia.',
        'icon': 'target',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4449.HEIC': {
        'id': 'dnd-fdm-paladin-alabarda-guardia',
        'name': 'Paladín Encapuchado con Alabarda',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Caballero sagrado de orden monacal con capucha mística y alabarda de parada.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4450.HEIC': {
        'id': 'dnd-fdm-necrofago-acechador',
        'name': 'Necrófago Acechador Cuadrúpedo',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Cadáver devorador encorvado reptando silenciosamente por las tumbas.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4451.HEIC': {
        'id': 'dnd-fdm-centinela-alabarda-escudo',
        'name': 'Centinela Real con Alabarda y Rodela',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guardia de muralla en posición firme con arma de asta curva y escudo protector.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4452.HEIC': {
        'id': 'dnd-fdm-cazador-monstruos-espada',
        'name': 'Cazador de Bestias con Gabardina',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Inquisidor o cazador gótico con capa larga, sombrero y espada de plata.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4453.HEIC': {
        'id': 'dnd-fdm-sombra-espectral',
        'name': 'Sombra Espectral del Abismo',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Entidad sombría amorfa que absorbe la fuerza vital de sus víctimas en la oscuridad.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4454.HEIC': {
        'id': 'dnd-fdm-picaro-mediano-dagas',
        'name': 'Pícaro Mediano Agazapado',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Aventurero halfling sigiloso preparado con dagas para asestar un golpe sorpresa.',
        'icon': 'dagger',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4455.HEIC': {
        'id': 'dnd-fdm-clerigo-espada-orbe',
        'name': 'Clérigo de la Luz con Espada Sagrada',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Sacerdote guerrero con túnica ceremonial, símbolo sagrado y hoja bendita.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4456.HEIC': {
        'id': 'dnd-fdm-enano-herrero-yunke',
        'name': 'Maestro Herrero Enano Descansando',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Artesano de las forjas enanas con delantal reforzado y mazo de forja.',
        'icon': 'anvil',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4457.HEIC': {
        'id': 'dnd-fdm-barbaro-hacha-escudo-1',
        'name': 'Bárbaro del Norte con Hacha (Pose 1)',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guerrero tribal salvaje en posición de embestida con hacha de combate y rodela.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4458.HEIC': {
        'id': 'dnd-fdm-goblin-saqueador-garfio',
        'name': 'Goblin Saqueador con Garfio',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Pequeño trasgo oportunista con arma de gancho curva para robar y apuñalar.',
        'icon': 'dagger',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4459.HEIC': {
        'id': 'dnd-fdm-druida-bosque-familiar',
        'name': 'Druida del Bosque con Báculo y Familiar',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Canalizador de la naturaleza con báculo de madera viva y espíritu animal acompañante.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4460.HEIC': {
        'id': 'dnd-fdm-barbaro-hacha-escudo-2',
        'name': 'Bárbaro del Norte con Hacha (Pose 2)',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Segunda perspectiva del bárbaro tribal alzando su hacha para un tajo letal.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4461.HEIC': {
        'id': 'dnd-fdm-cultista-craneos-tunica',
        'name': 'Cultista Invocador de Cráneos',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Fanático de cultos oscuros rodeado de ofrendas óseas y ropajes ceremoniales.',
        'icon': 'book',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4462.HEIC': {
        'id': 'dnd-fdm-caballero-placas-guardia',
        'name': 'Caballero en Armadura de Placas Pesada',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guerrero noble acorazado con hombreras monumentales y espada al cinto.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4463.HEIC': {
        'id': 'dnd-fdm-paladin-comandante-espada',
        'name': 'Comandante Paladín con Espada Imperial',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Héroe de leyenda posando con la espada clavada en tierra sobre peana escénica.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4465.HEIC': {
        'id': 'dnd-fdm-asesino-elfo-acrobata',
        'name': 'Asesino Elfo Acróbata de las Sombras',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Pícaro ágil impulsándose desde una repisa de roca para caer sobre su presa.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4467.HEIC': {
        'id': 'dnd-fdm-esqueleto-guerrero-espadon',
        'name': 'Esqueleto Guerrero con Espada Bastarda',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Guerrero caído reanimado empuñando una pesada espada de dos manos.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4468.HEIC': {
        'id': 'dnd-fdm-tirador-muralla',
        'name': 'Tirador Cazador en Muralla',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Arquero táctico encaramado en defensas de piedra calculando su próximo disparo.',
        'icon': 'target',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4469.HEIC': {
        'id': 'dnd-fdm-bestia-caverna-agazapada',
        'name': 'Bestia Monstruosa de las Profundidades',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Monstruosidad de las cavernas con lomo espinoso y zarpas afiladas agazapada.',
        'icon': 'dagger',
        'tag_scale': 'Mediano'
    },
    'IMG_4470.HEIC': {
        'id': 'dnd-fdm-medico-peste-cuervo',
        'name': 'Médico de la Peste con Máscara de Cuervo',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Sanador siniestro con máscara de pico, sombrero y báculo de sahumerio.',
        'icon': 'book',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4471.HEIC': {
        'id': 'dnd-fdm-chaman-goblin-bastones',
        'name': 'Chamán Goblin con Doble Cetro de Hechizo',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Brujo trasgo en éxtasis mágico canalizando energía caótica con ambas manos.',
        'icon': 'dagger',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4472.HEIC': {
        'id': 'dnd-fdm-liche-renacido-cripta',
        'name': 'Liche Resucitado de la Cripta Olvidada',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Señor no-muerto de inmenso poder emergiendo victorioso de un sepulcro ancestral.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4473.HEIC': {
        'id': 'dnd-fdm-golem-vapor-constructo',
        'name': 'Gólem a Vapor y Calderas de Asedio',
        'tier': 'monstruo-grande',
        'subCategory': 'monstruos',
        'desc': 'Constructo mecánico titánico propulsado por vapor con chimeneas dorsales y puño de hierro.',
        'icon': 'mech',
        'tag_scale': 'Gran Tamaño'
    },
    'IMG_4474.HEIC': {
        'id': 'dnd-fdm-senor-vampiro-capa',
        'name': 'Señor Vampiro con Capa Espectral',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Señor de la noche con porte aristocrático y manto fluido disolviéndose en sombras.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4475.HEIC': {
        'id': 'dnd-fdm-abominacion-brazo-garra',
        'name': 'Guerrero No-Muerto con Garra Mutada',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Soldado caído transformado por magia nigromántica con una zarpa desproporcionada.',
        'icon': 'dagger',
        'tag_scale': 'Mediano'
    },
    'IMG_4476.HEIC': {
        'id': 'dnd-fdm-farolero-nocturno-calle',
        'name': 'Sereno Nocturno con Farol de Niebla',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guardián urbano con abrigo largo y farol de poste patrullando las calles brumosas.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4477.HEIC': {
        'id': 'dnd-fdm-guerrera-amazona-espada',
        'name': 'Guerrera Amazona con Espada Ancha',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Heroína tribal atlética en pose de combate con espada ancha a dos manos.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4478.HEIC': {
        'id': 'dnd-fdm-esqueleto-acechador-garras',
        'name': 'Esqueleto Acechador Encorvado',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'No-muerto esquelético agachado acechando desde las sombras del calabozo.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4479.HEIC': {
        'id': 'dnd-fdm-picaro-explorador-roca',
        'name': 'Pícaro Explorador Vigilando',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Explorador sigiloso apostado en una posición ventajosa para cubrir a su grupo.',
        'icon': 'target',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4480.HEIC': {
        'id': 'dnd-fdm-duende-encorvado-cavernas',
        'name': 'Duende de las Cavernas Agazapado',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Criatura subterránea escurridiza ocultándose tras las formaciones rocosas.',
        'icon': 'dagger',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4481.HEIC': {
        'id': 'dnd-fdm-duende-subterraneo-garrote',
        'name': 'Duende Subterráneo con Daga',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Esbirro enano de túnel preparado para emboscadas nocturnas.',
        'icon': 'dagger',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4482.HEIC': {
        'id': 'dnd-fdm-chaman-hueso-baculo-alto',
        'name': 'Chamán de los Huesos con Gran Báculo Sacro',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Sacerdote tribal con báculo tallado en espina dorsal y fémures rituales.',
        'icon': 'book',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4483.HEIC': {
        'id': 'dnd-fdm-ronin-errante-sombrero',
        'name': 'Ronin Errante con Sombrero Cónico y Bastón',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Monje viajero de tierras orientales con sombrero kasa tradicional y vara de roble.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4484.HEIC': {
        'id': 'dnd-fdm-samurai-oriental-katana',
        'name': 'Guerrero Samurái Oriental en Guardia',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Maestro de la espada en postura defensiva con katana desenfundada.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4485.HEIC': {
        'id': 'dnd-fdm-guardian-cripta-lanza',
        'name': 'Guardián de la Cripta con Lanza Ósea',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Custodio impío de túmulos armado con pica y vestimentas funerarias.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4486.HEIC': {
        'id': 'dnd-fdm-taumaturgo-enano-tunica',
        'name': 'Taumaturgo Enano con Túnica Ritual',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Sabio de la corte enana portador de runas de protección y cetro de poder.',
        'icon': 'book',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4487.HEIC': {
        'id': 'dnd-fdm-alquimista-tomo-pergamino',
        'name': 'Erudito Alquimista con Tomo Arcano',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Mago erudito estudiando fórmulas mágicas en medio del campo de batalla.',
        'icon': 'book',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4488.HEIC': {
        'id': 'dnd-fdm-tirador-francotirador-arcabuz',
        'name': 'Tirador de Élite Apuntando',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Cazador experto con arma a distancia en posición de tiro precisa.',
        'icon': 'target',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4489.HEIC': {
        'id': 'dnd-fdm-invocador-orbe-mistico',
        'name': 'Invocador Celestial con Orbe Místico',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Canalizador arcano suspendiendo una esfera resplandeciente con su energía.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4490.HEIC': {
        'id': 'dnd-fdm-sacerdotisa-medusa-serpientes',
        'name': 'Sacerdotisa Gorgona con Tocado de Serpientes',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Hechicera abisal con serpientes vivas entrelazadas en su corona mística.',
        'icon': 'dragon',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4491.HEIC': {
        'id': 'dnd-fdm-arquero-silvano-encapuchado',
        'name': 'Arquero Silvano de los Bosques Profundos',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Tirador élfico con arco compuesto y flecha tensada listo para disparar.',
        'icon': 'target',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4493.HEIC': {
        'id': 'dnd-fdm-senor-guerra-caudillo',
        'name': 'Caudillo de la Guerra en el Trono',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Líder orco veterano sentado sobre restos de sus enemigos en trono de guerra.',
        'icon': 'knight',
        'tag_scale': 'Mediano'
    },
    'IMG_4494.HEIC': {
        'id': 'dnd-fdm-enano-minero-cantero',
        'name': 'Enano Cantero con Martillo Pesado',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Picapedrero enano con barbas trenzadas y martillo de cantería de roca dura.',
        'icon': 'anvil',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4495.HEIC': {
        'id': 'dnd-fdm-enano-demoledor-maza',
        'name': 'Enano Demoledor con Gran Mazo Hexagonal',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guerrero de asedio cargando una maza maciza capaz de quebrar puertas fortificadas.',
        'icon': 'anvil',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4496.HEIC': {
        'id': 'dnd-fdm-barbaro-mandoble-pesado',
        'name': 'Bárbaro Berserker con Mandoble Gigante',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guerrero colosal empuñando una espada de dos manos de tamaño descomunal.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4497.HEIC': {
        'id': 'dnd-fdm-danzante-palma-marcial',
        'name': 'Danzante Marcial de la Palma Mística',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Monje femenina en elegante postura marcial canalizando energía ki.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4498.HEIC': {
        'id': 'dnd-fdm-enano-pistolero-trabucos',
        'name': 'Enano Pistolero con Doble Trabuco',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Artificiero enano audaz con pistolas de chispa en ambas manos.',
        'icon': 'target',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4499.HEIC': {
        'id': 'dnd-fdm-senor-enano-hacha-real',
        'name': 'Señor Enano Acorazado con Hacha de Reyes',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Monarca guerrero bajo la montaña con cota de escamas y hacha ceremonial.',
        'icon': 'shield',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4500.HEIC': {
        'id': 'dnd-fdm-explorador-elfico-agazapado',
        'name': 'Explorador Élfico Acechador con Arco',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Vigía del bosque agachado entre la maleza preparando una emboscada.',
        'icon': 'target',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4501.HEIC': {
        'id': 'dnd-fdm-archimago-baculo-solar',
        'name': 'Archimago Imperial con Báculo del Sol',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Gran hechicero de la corte con ropas sagradas y cetro de resplandor radiante.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4502.HEIC': {
        'id': 'dnd-fdm-barbaro-golpe-demoledor',
        'name': 'Bárbaro Golpeador con Maza en Alto',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guerrero musculoso a punto de descargar un golpe demoledor sobre el suelo.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4503.HEIC': {
        'id': 'dnd-fdm-anciano-ermitano-baston',
        'name': 'Anciano Ermitaño con Bastón Nudoso',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Viejo sabio de los caminos con barba canosa y bastón de viaje.',
        'icon': 'book',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4504.HEIC': {
        'id': 'dnd-fdm-halfling-aventurero-viajero',
        'name': 'Aventurero Halfling con Daga',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Mediano alegre pero valiente con cuchillo en mano listo para la aventura.',
        'icon': 'dagger',
        'tag_scale': 'Escala 28mm'
    },
    'IMG_4505.HEIC': {
        'id': 'dnd-fdm-asesino-sombras-agachado',
        'name': 'Asesino Encapuchado en las Sombras',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Agente sigiloso aguardando en un callejón oscuro el paso de su objetivo.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4506.HEIC': {
        'id': 'dnd-fdm-guardian-bosque-rodela',
        'name': 'Guardián del Bosque con Rodela y Daga',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Defensor silvano en postura defensiva protegiendo las fronteras del reino.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4507.HEIC': {
        'id': 'dnd-fdm-bruja-cadaver-nigromante',
        'name': 'Reina Cadáver & Bruja Nigromante',
        'tier': 'monstruo-mediano',
        'subCategory': 'monstruos',
        'desc': 'Soberana de la muerte coronada por calaveras que comanda legiones de aparecidos.',
        'icon': 'shield',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4508.HEIC': {
        'id': 'dnd-fdm-esqueleto-infanteria-escudo',
        'name': 'Esqueleto Infante con Escudo y Espada Corta',
        'tier': 'esbirro',
        'subCategory': 'esbirros',
        'desc': 'Soldado esquelético de choque con escudo redondo y espada corta de bronce.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4509.HEIC': {
        'id': 'dnd-fdm-berserker-espada-ejecutor',
        'name': 'Berserker Acorazado con Espada de Ejecutor',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Guerrero de élite blindado con espada de hoja ancha al hombro.',
        'icon': 'knight',
        'tag_scale': 'Escala 32mm'
    },
    'IMG_4510.HEIC': {
        'id': 'dnd-fdm-picaro-pirata-barril',
        'name': 'Pícaro Corsario Sentado en Barril',
        'tier': 'heroe',
        'subCategory': 'heroes',
        'desc': 'Bribón de taberna portuaria con sombrero marinero sentado casualmente sobre un barril.',
        'icon': 'dagger',
        'tag_scale': 'Escala 32mm'
    }
}

def main():
    print("🚀 [FORJA LEVI] Procesando 82 fotos y registrando en el catálogo...")
    print("──────────────────────────────────────────────────────────────────")

    # 1. Cargar JSON existente
    with open(JSON_PATH, "r", encoding="utf-8") as f:
        products_data = json.load(f)

    existing_products = {p["id"]: p for p in products_data["products"]}
    processed_count = 0
    total_orig_bytes = 0
    total_opt_bytes = 0

    # 2. Procesar imágenes
    for filename, info in MAPPING.items():
        src_path = FOTOS_DIR / filename
        if not src_path.exists():
            print(f"⚠️ No se encontró: {filename}")
            continue

        prod_id = info["id"]
        out_webp_name = f"{prod_id}.webp"
        out_webp_path = OUT_IMG_DIR / out_webp_name

        orig_size = src_path.stat().st_size
        total_orig_bytes += orig_size

        try:
            with Image.open(src_path) as im:
                im = ImageOps.exif_transpose(im)
                im = im.convert("RGB")
                im.thumbnail((900, 900), Image.Resampling.LANCZOS)
                im.save(out_webp_path, "WEBP", quality=82, method=6)

            new_size = out_webp_path.stat().st_size
            total_opt_bytes += new_size
            processed_count += 1

            if processed_count % 10 == 0 or processed_count == len(MAPPING):
                print(f"   [{processed_count}/{len(MAPPING)}] Optimizado: {out_webp_name} ({orig_size // 1024} KB -> {new_size // 1024} KB)")

        except Exception as e:
            print(f"❌ Error al procesar {filename}: {e}")
            continue

        # 3. Crear / Actualizar producto en products.json
        tier_data = tiers.get(info["tier"], {"price": 5000, "paint": 10000})
        base_price = tier_data.get("price", 5000)
        paint_price = tier_data.get("paint", 10000)

        product_obj = {
            "id": prod_id,
            "name": info["name"],
            "category": "miniaturas-dnd",
            "subCategory": info["subCategory"],
            "price": base_price,
            "priceLabel": "Precio total:",
            "description": info["desc"],
            "tags": [
                {"text": "FDM Eco", "type": "fdm"},
                {"text": info["tag_scale"], "type": "scale"}
            ],
            "image": f"assets/img/productos/{out_webp_name}",
            "placeholderText": "Foto del Modelo",
            "icon": info["icon"],
            "painting": {
                "available": True,
                "cost": paint_price,
                "label": "Pintado Tabletop"
            },
            "tier": info["tier"]
        }

        # Actualizar o agregar
        if prod_id in existing_products:
            # Reemplazar existente
            idx = next(i for i, p in enumerate(products_data["products"]) if p["id"] == prod_id)
            products_data["products"][idx] = product_obj
        else:
            products_data["products"].append(product_obj)
            existing_products[prod_id] = product_obj

    # 4. Guardar data/products.json
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(products_data, f, indent=2, ensure_ascii=False)

    # 5. Guardar js/products-data.js (fallback offline)
    js_content = f"/**\n * FORJA LEVI — Catálogo Canónico y Fallback Offline\n */\n\nwindow.FORJA_CATALOG_DATA = {json.dumps(products_data, indent=2, ensure_ascii=False)};\n"
    with open(JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_content)

    orig_mb = total_orig_bytes / (1024 * 1024)
    opt_mb = total_opt_bytes / (1024 * 1024)
    savings = (1 - (total_opt_bytes / total_orig_bytes)) * 100 if total_orig_bytes > 0 else 0

    print("──────────────────────────────────────────────────────────────────")
    print(f"🎉 ¡PROCESO COMPLETADO EXITOSAMENTE!")
    print(f"   • Fotos optimizadas:     {processed_count}")
    print(f"   • Peso original:          {orig_mb:.2f} MB")
    print(f"   • Peso final WebP:        {opt_mb:.2f} MB")
    print(f"   • Ahorro de espacio web:  {savings:.1f}%")
    print(f"   • Total productos web:    {len(products_data['products'])}")
    print("──────────────────────────────────────────────────────────────────\n")

if __name__ == "__main__":
    main()
