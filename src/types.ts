export interface PlantInfo {
  id: string;
  name: string;
  scientificName: string;
  description: string;
  idealClimate: {
    temperature: string; // e.g. "15-25°C"
    sunlight: string; // e.g. "Sol directo" or "Sombra parcial"
    humidity: string; // e.g. "Baja-Media"
  };
  soilRequirements: {
    ph: string; // e.g. "6.0-7.5"
    type: string; // e.g. "Sustrato arenoso y bien drenado"
    nutrients: string; // e.g. "Media materia orgánica"
  };
  lunarPhaseAdvice: {
    bestPhase: string; // Luna Nueva, Creciente, Llena, Menguante
    explanation: string;
  };
  wateringFrequencyDays: number;
  careAlerts: string[];
  benefits: string[];
  progressionStages: {
    germinationDays: number;
    growthDays: number;
    floweringDays: number;
    harvestDays: number;
  };
}

export interface MyGardenPlant {
  id: string; // unique instance ID
  plantId: string; // references PlantInfo.id or is "custom"
  customName?: string; // custom species entered by user
  plantInfo: PlantInfo;
  location: string; // e.g. "Santiago, Chile" or "Interior del hogar"
  plantedAt: string; // ISO Date
  lastWateredAt: string; // ISO Date
  progressPercentage: number; // 0 to 100
  currentStage: "Brote / Semilla" | "Crecimiento" | "Maduración" | "Floración" | "Listo para Cosecha";
  alerts: string[]; // generated dynamically (e.g. "Requiere riego hoy", "Alerta frío")
}

export interface WeatherData {
  city: string;
  temperature: number;
  humidity: number;
  condition: string;
  lunarPhase: string; // Luna Llena, Luna Nueva, etc.
  lunarPhaseIcon: string;
}

export interface AlertLog {
  id: string;
  plantInstanceId: string;
  plantName: string;
  type: "riego" | "clima" | "lunar" | "tierra";
  message: string;
  createdAt: string;
  resolved: boolean;
}
