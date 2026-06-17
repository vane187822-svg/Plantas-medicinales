import { PlantInfo } from "../types";

export const PRELOADED_PLANTS: PlantInfo[] = [
  {
    id: "romero",
    name: "Romero",
    scientificName: "Rosmarinus officinalis",
    description: "Arbusto leñoso aromático de hojas perennes. Estimula la circulación, mejora la memoria y posee propiedades antioxidantes y digestivas.",
    idealClimate: {
      temperature: "15-30°C (Templado-Cálido)",
      sunlight: "Sol directo completo",
      humidity: "Baja (Tolera bien la sequía)"
    },
    soilRequirements: {
      ph: "6.5 - 7.8 (Ligeramente alcalino)",
      type: "Tierra arenosa, suelta, muy ligera y con excelente drenaje",
      nutrients: "Bajas exigencias, evitar abonos frescos cargados de nitrógeno"
    },
    lunarPhaseAdvice: {
      bestPhase: "Luna Creciente",
      explanation: "Favorece el desarrollo y propagación de esquejes, estimulando el rápido crecimiento de nuevas ramas cargadas de aceites esenciales."
    },
    wateringFrequencyDays: 8,
    careAlerts: [
      "No encharcar las raíces (el exceso de agua es su peor enemigo).",
      "Proteger de fríos extremos o heladas prolongadas en su etapa joven.",
      "Realizar podas de mantenimiento después de la floración para mantenerlo denso."
    ],
    benefits: [
      "Mejora la memoria, concentración y agilidad mental mediante la inhalación de su aroma.",
      "Alivia la indigestión, espasmos estomacales y la inflamación de las vías biliares.",
      "Estimula la circulación sanguínea local y capilar, combatiendo la caída del cabello.",
      "Posee propiedades antibacterianas y antioxidantes que tonifican el sistema inmune."
    ],
    progressionStages: {
      germinationDays: 20,
      growthDays: 60,
      floweringDays: 45,
      harvestDays: 120
    }
  },
  {
    id: "menta",
    name: "Menta",
    scientificName: "Mentha spicata",
    description: "Hierba perenne de rápido crecimiento y aroma refrescante. Alivia dolores estomacales, combate la fatiga y es famosa por sus usos culinarios.",
    idealClimate: {
      temperature: "12-24°C (Templado)",
      sunlight: "Sombra parcial o sol tamizado",
      humidity: "Media-Alta (Suelo húmedo constante)"
    },
    soilRequirements: {
      ph: "6.0 - 7.3 (Neutro)",
      type: "Sustrato mullido rico en humus que retenga la humedad sin encharcar",
      nutrients: "Alta demanda de compost orgánico o abono líquido mensual"
    },
    lunarPhaseAdvice: {
      bestPhase: "Luna Nueva",
      explanation: "En luna nueva, la savia se concentra en raíces y la parte aérea descansa, facilitando adaptaciones post-transplante e hidratación basal."
    },
    wateringFrequencyDays: 2,
    careAlerts: [
      "Evitar la sequía total del sustrato (marchitaría sus hojas rápidamente).",
      "Controlar su expansión; es altamente invasiva (mejor plantar en macetas individuales).",
      "Vigilar la aparición de caracoles, babosas o roya en condiciones de alta humedad."
    ],
    benefits: [
      "Alivia eficazmente las flatulencias, las náuseas y el dolor del síndrome de colon irritable.",
      "Sus vapores de mentol descongestionan las fosas nasales y calman la tos moderada.",
      "Reduce los dolores de cabeza de tensión al aplicar aceite esencial diluido en las sienes.",
      "Tiene efecto refrescante y combate el mal aliento (halitosis) de forma inmediata."
    ],
    progressionStages: {
      germinationDays: 12,
      growthDays: 40,
      floweringDays: 30,
      harvestDays: 80
    }
  },
  {
    id: "manzanilla",
    name: "Manzanilla",
    scientificName: "Matricaria chamomilla",
    description: "Planta herbácea anual de pequeñas flores similares a margaritas. Relajante, antiinflamatoria y excelente reductor de molestias digestivas.",
    idealClimate: {
      temperature: "15-22°C (Templado moderado)",
      sunlight: "Sol pleno directo",
      humidity: "Baja-Media"
    },
    soilRequirements: {
      ph: "5.5 - 7.5 (Ampliamente adaptable)",
      type: "Tierra franca, aireada, arenosa y con excelente filtración",
      nutrients: "Moderados exigencias; un exceso de abono puede reducir el aroma de sus flores"
    },
    lunarPhaseAdvice: {
      bestPhase: "Luna Llena",
      explanation: "Momento ideal para cosechar sus flores aromáticas, ya que la savia asciende con fuerza y concentra los aceites esenciales en la corola floral."
    },
    wateringFrequencyDays: 4,
    careAlerts: [
      "Regar moderadamente; prefiere micro-riegos frecuentes antes que inundaciones.",
      "Cosechar las flores abriéndose por la mañana para conservar su potencia medicinal.",
      "Retirar flores secas para incentivar el florecimiento continuo."
    ],
    benefits: [
      "Potente inductor del sueño y relajante muscular natural, excelente para calmar la ansiedad.",
      "Calma la acidez, gastritis y la pesadez de estómago debido a sus propiedades antiespasmódicas.",
      "Sirve para tratar irritaciones oculares superficiales (conjuntivitis) en compresas tibias puras.",
      "Es una gran aliada para aliviar las molestias de la menstruación o espasmos generales."
    ],
    progressionStages: {
      germinationDays: 10,
      growthDays: 45,
      floweringDays: 35,
      harvestDays: 90
    }
  },
  {
    id: "aloe_vera",
    name: "Aloe Vera",
    scientificName: "Aloe barbadensis miller",
    description: "Planta suculenta con hojas carnosas de bordes espinosos. Su gel interno es un poderoso restaurador dérmico, cicatrizante y antiinflamatorio tópico.",
    idealClimate: {
      temperature: "18-35°C (Cálido-Seco)",
      sunlight: "Sol directo intenso (evitar quemaduras en verano de climas desérticos)",
      humidity: "Muy Baja"
    },
    soilRequirements: {
      ph: "6.5 - 8.0 (Neutro a alcalino)",
      type: "Sustrato para cactus y suculentas con perlita o arena volcánica",
      nutrients: "Poco exigente; basta con añadir humus de lombriz al inicio de primavera"
    },
    lunarPhaseAdvice: {
      bestPhase: "Luna Menguante",
      explanation: "Perfecto para recolectar sus pencas exteriores, ya que la planta tiene menor circulación aérea de savia líquida facilitando el sellado de los cortes."
    },
    wateringFrequencyDays: 12,
    careAlerts: [
      "Regar únicamente cuando el sustrato esté completamente seco en un 80%.",
      "Proteger contra temperaturas por debajo de los 10°C, pues acumula agua y puede congelarse.",
      "Asegurar macetas con agujeros de drenaje amplios para evitar raíces podridas."
    ],
    benefits: [
      "Acelera significativamente la cicatrización de quemaduras leves, eccemas y heridas superficiales.",
      "Calma picaduras de insectos e hidrata profundamente la dermis gracias a sus mucílagos.",
      "Mejora la digestión y actúa como un laxante suave si se consume su jugo adecuadamente purificado.",
      "Ayuda a reducir la placa dental y alivia las encías inflamadas o llagas bucales."
    ],
    progressionStages: {
      germinationDays: 30,
      growthDays: 120,
      floweringDays: 60,
      harvestDays: 210
    }
  },
  {
    id: "calendula",
    name: "Caléndula",
    scientificName: "Calendula officinalis",
    description: "Hermosa planta de flores naranjas y amarillas intensas. Ideal para cicatrizar heridas, calmar eccemas cutáneos y como antibacteriano natural.",
    idealClimate: {
      temperature: "14-25°C (Templado fresco)",
      sunlight: "Sol directo o semisombra ligera",
      humidity: "Media"
    },
    soilRequirements: {
      ph: "6.0 - 7.5",
      type: "Sustrato suelto y nutritivo con buena filtración de agua",
      nutrients: "Moderado a alto; agradece un aporte regular de composta orgánica"
    },
    lunarPhaseAdvice: {
      bestPhase: "Luna Creciente",
      explanation: "El influjo lunar impulsa la expansión foliar y prepara el vigor de la planta hacia su profusa y asombrosa floración medicinal."
    },
    wateringFrequencyDays: 3,
    careAlerts: [
      "Humedecer la base de la planta, evitando mojar exageradamente las flores.",
      "Podar las flores marchitas para incentivar un ciclo de brotes incansables.",
      "Preventivamente aplicar infusión de cola de caballo para evitar hongos como el oídio."
    ],
    benefits: [
      "Extraordinaria acción dermatológica; alivia la dermatitis del pañal y pieles agrietadas.",
      "Combate infecciones cutáneas leves gracias a sus potentes activos fúngicos y antibacterianos.",
      "Estimula la producción de colágeno favoreciendo la regeneración celular de tejidos dañados.",
      "Ayuda a regular los flujos menstruales irregulares consumido de manera controlada."
    ],
    progressionStages: {
      germinationDays: 8,
      growthDays: 35,
      floweringDays: 25,
      harvestDays: 70
    }
  },
  {
    id: "lavanda",
    name: "Lavanda",
    scientificName: "Lavandula angustifolia",
    description: "Arbusto perenne con espigas florales violetas. Su fragancia calma la ansiedad, promueve el sueño reparador y ahuyenta plagas del huerto.",
    idealClimate: {
      temperature: "15-32°C (Templado seco)",
      sunlight: "Sol directo riguroso",
      humidity: "Muy Baja"
    },
    soilRequirements: {
      ph: "7.0 - 8.5 (Alcalino calcáreo)",
      type: "Tierra con buen drenaje, arenosa o con gravilla",
      nutrients: "Nula exigencia de fertilización pesada; no tolera abonos muy ácidos"
    },
    lunarPhaseAdvice: {
      bestPhase: "Luna Llena",
      explanation: "La densidad de su característico perfume alcanza su cenit en la noche de luna llena, siendo el instante estelar para cosechar espigas florales."
    },
    wateringFrequencyDays: 10,
    careAlerts: [
      "Permitir la sequedad completa antes de regar nuevamente.",
      "Evitar la sombra o sitios húmedos estancados que ahoguen sus tallos.",
      "Podar a un tercio de su tamaño a finales de otoño para estimular arbustos fuertes en primavera."
    ],
    benefits: [
      "Ejerce un sedante suave del sistema nervioso; inhalarla reduce pulso rápido y estrés.",
      "Combate el insomnio crónico si se vaporiza en almohadas o sábanas antes de dormir.",
      "Mitiga dolores musculares, neuralgias y cefaleas mediante masajes con su macerado.",
      "Funciona como repelente natural de polillas, mosquitos y pulgones en el hogar."
    ],
    progressionStages: {
      germinationDays: 25,
      growthDays: 70,
      floweringDays: 45,
      harvestDays: 140
    }
  }
];
