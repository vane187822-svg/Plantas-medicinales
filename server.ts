import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { PRELOADED_PLANTS } from "./src/data/plants.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy initialization of Gemini API Client to prevent crashes when GEMINI_API_KEY is unset
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error("GEMINI_API_KEY no configurado en secretos.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// ---------------- API ENDPOINTS ----------------

// 1. Weather and Lunar Data API
app.get("/api/weather", (req: Request, res: Response) => {
  const city = (req.query.city as string) || "Madrid";
  
  // Base default simulated weather coordinates & information for Spanish/LatAm target regions
  const locations: Record<string, { temp: number; hum: number; rain: string }> = {
    "madrid": { temp: 22, hum: 40, rain: "Despejado" },
    "bogota": { temp: 14, hum: 80, rain: "Llovizna suave" },
    "santiago": { temp: 18, hum: 55, rain: "Despejado" },
    "buenos aires": { temp: 20, hum: 65, rain: "Nublado parcial" },
    "cdmx": { temp: 23, hum: 50, rain: "Intervalos lluviosos" },
    "lima": { temp: 19, hum: 85, rain: "Niebla templada" },
  };

  const key = city.toLowerCase().trim();
  const matched = locations[key] || { temp: 21, hum: 60, rain: "Intervalos templados" };

  // Biodynamic agriculture follows synodic moon cycles. Let's calculate moon phase based on current Year-Month-Day
  const today = new Date();
  const day = today.getDate();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  
  // Approximate lunar phase index (simple meton cycle approximation for demonstration)
  const lY = year - 2000;
  const rawPhase = ((lY * 11) - 14 + month + day) % 30;
  let phaseName = "";
  let phaseIcon = "";
  let phaseAdvice = "";

  if (rawPhase < 7.4) {
    phaseName = "Luna Nueva";
    phaseIcon = "🌑";
    phaseAdvice = "Savia concentrada en la raíz. Época ideal para podar ramas enfermas, desyerbar y sembrar hierbas de hojas finas como mentas bajo suelo húmedo.";
  } else if (rawPhase < 14.8) {
    phaseName = "Luna Creciente";
    phaseIcon = "🌒";
    phaseAdvice = "La savia asciende hacia las ramas superiores. Excelente para sembrar plantas de follaje denso y aceites aromáticos como Romero, Albahaca y Caléndula.";
  } else if (rawPhase < 22.1) {
    phaseName = "Luna Llena";
    phaseIcon = "🌕";
    phaseAdvice = "Savia totalmente concentrada en flores y frutos. El mejor momento para cosechar flores medicinales (Manzanilla, Lavanda) para potenciar aceites esenciales.";
  } else {
    phaseName = "Luna Menguante";
    phaseIcon = "🌘";
    phaseAdvice = "La savia baja nuevamente. Momento estelar para recolectar pencas de Aloe, sembrar bulbos, podar estolones e incorporar compost rico para alimentar la tierra.";
  }

  res.json({
    city: city.charAt(0).toUpperCase() + city.slice(1),
    temperature: matched.temp,
    humidity: matched.hum,
    condition: matched.rain,
    lunarPhase: phaseName,
    lunarPhaseIcon: phaseIcon,
    lunarPhaseAdvice: phaseAdvice
  });
});

// 2. Client Botanical Search / AI Synthesis
app.post("/api/gemini/analyze-plant", async (req: Request, res: Response) => {
  const { name, location } = req.body;
  if (!name) {
    return res.status(400).json({ error: "El nombre de la planta medicinal es requerido." });
  }

  const normalizedQuery = name.toLowerCase().trim();
  
  // 1. Check if we can find a matching preloaded plant to save users API latency/cost or act as immediate response
  const preloadedMatch = PRELOADED_PLANTS.find(
    (p) => p.name.toLowerCase().includes(normalizedQuery) || normalizedQuery.includes(p.name.toLowerCase())
  );

  try {
    const ai = getGeminiClient();

    // Promp to synthesize tailored botanical knowledge using gemini-3.5-flash with a precise JSON response schema
    const promptMessage = `Analiza la planta medicinal con el nombre "${name}" para cultivar en la ubicación "${location || "Un huerto casero genérico"}". Brinda detalles del clima idóneo, suelo y pautas biodinámicas lunares estables. Traduce todo al español.`;

    const modelResponse = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptMessage,
      config: {
        systemInstruction: "Eres un botánico y agrónomo excepcional especializado en medicina naturopática, agricultura biodinámica y huertos caseros. Escribe siempre en un tono profesional, certero, empático y en idioma español.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nombre común de la planta en español" },
            scientificName: { type: Type.STRING, description: "Nombre científico completo" },
            description: { type: Type.STRING, description: "Propiedades terapéuticas y descripción de la planta medicinal" },
            idealClimate: {
              type: Type.OBJECT,
              properties: {
                temperature: { type: Type.STRING, description: "Rango óptimo térmico en Celsius, ej: 18-24°C" },
                sunlight: { type: Type.STRING, description: "Requerimiento de radiación solar, ej: Sol directo" },
                humidity: { type: Type.STRING, description: "Nivel de humedad ideal" }
              },
              required: ["temperature", "sunlight", "humidity"]
            },
            soilRequirements: {
              type: Type.OBJECT,
              properties: {
                ph: { type: Type.STRING, description: "Rango de pH sugerido" },
                type: { type: Type.STRING, description: "Sustrato, ej: Tierra arenosa con vermiculita" },
                nutrients: { type: Type.STRING, description: "Abono o bioestimulante recomendado" }
              },
              required: ["ph", "type", "nutrients"]
            },
            lunarPhaseAdvice: {
              type: Type.OBJECT,
              properties: {
                bestPhase: { type: Type.STRING, description: "Fase lunar perfecta (Luna Nueva, Luna Creciente, Luna Llena o Luna Menguante)" },
                explanation: { type: Type.STRING, description: "Justificación de cómo la luna influye en el cultivo de esta especie" }
              },
              required: ["bestPhase", "explanation"]
            },
            wateringFrequencyDays: { type: Type.INTEGER, description: "Frecuencia de riego sugerida en días" },
            careAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de 3 advertencias importantes durante su desarrollo"
            },
            benefits: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista con 4 aportes o beneficios a la salud, medicinales y terapéuticos de la planta"
            },
            progressionStages: {
              type: Type.OBJECT,
              properties: {
                germinationDays: { type: Type.INTEGER },
                growthDays: { type: Type.INTEGER },
                floweringDays: { type: Type.INTEGER },
                harvestDays: { type: Type.INTEGER }
              },
              required: ["germinationDays", "growthDays", "floweringDays", "harvestDays"]
            }
          },
          required: ["name", "scientificName", "description", "idealClimate", "soilRequirements", "lunarPhaseAdvice", "wateringFrequencyDays", "careAlerts", "benefits", "progressionStages"]
        }
      }
    });

    if (modelResponse.text) {
      const botanicalInfo = JSON.parse(modelResponse.text);
      // Give it an ID
      botanicalInfo.id = "custom_" + Date.now();
      return res.json(botanicalInfo);
    } else {
      throw new Error("No se pudo extraer texto descriptivo de Gemini.");
    }
  } catch (error: any) {
    console.warn("Gemini API call failed or is unconfigured. Falling back to structured search.", error.message);
    
    // Smooth, descriptive fallback. If we match a preloaded species, return it.
    if (preloadedMatch) {
      return res.json({
        ...preloadedMatch,
        id: "cf_" + Date.now() + "_" + preloadedMatch.id,
        description: `(Catálogo) ${preloadedMatch.description}`
      });
    }

    // Generaremos una respuesta estructurada educada basada en pre-procesado si no posee API Key
    const formattedFallback = {
      id: "cf_" + Date.now(),
      name: name.charAt(0).toUpperCase() + name.slice(1),
      scientificName: `${name.charAt(0).toUpperCase()}${name.slice(1)} spp.`,
      description: `Planta medicinal de uso ancestral para dolores estomacales e inflamación general. (Nota: Configura tu API Key en Configuración > Secretos para obtener un análisis medicinal por inteligencia artificial exacto para este espécimen botánico).`,
      idealClimate: {
        temperature: "15-25°C (Templado)",
        sunlight: "Sombra parcial o semisombra",
        humidity: "Media"
      },
      soilRequirements: {
        ph: "6.0 - 7.0 (Neutro)",
        type: "Tierra de jardín enriquecida con materia orgánica y compost vegetal",
        nutrients: "Humus de lombriz cada 6 meses"
      },
      lunarPhaseAdvice: {
        bestPhase: "Luna Creciente",
        explanation: "La gravedad lunar promueve el enraizamiento acelerado de las plántulas medicinales y propaga brotes vigorosos."
      },
      wateringFrequencyDays: 4,
      careAlerts: [
        "Vigilar el drenaje de la maceta para prevenir asfixia de la raíz.",
        "Limpiar las hojas afectadas por insectos pulgones aplicando infusión de ajo.",
        "Ubicación protegida de corrientes frías durante las noches invernales."
      ],
      benefits: [
        "Alivia dolores gástricos y digestiones lentas.",
        "Aporta compuestos flavonoides con efecto antioxidante suave.",
        "Ayuda a relajar tensiones mediante infusiones aromáticas.",
        "Reduce dolores e inflamaciones bucales leves en enjuagues."
      ],
      progressionStages: {
        germinationDays: 14,
        growthDays: 45,
        floweringDays: 30,
        harvestDays: 95
      }
    };
    return res.json(formattedFallback);
  }
});

// ---------------- VITE MIDDLEWARE SETUP ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    // Mount Vite's dev asset middleware
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Huerto Server] Servidor corriendo en puerto ${PORT}`);
  });
}

startServer();
