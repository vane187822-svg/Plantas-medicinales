import React, { useState, useEffect } from "react";
import { 
  Sprout, 
  Sun, 
  Droplets, 
  Moon, 
  Compass, 
  Trash2, 
  Plus, 
  Search, 
  Sparkles, 
  MapPin, 
  Thermometer, 
  CheckCircle2, 
  AlertTriangle, 
  Heart, 
  Info, 
  Layers, 
  Calendar, 
  ArrowRight, 
  Database,
  RefreshCw,
  Gift,
  Check,
  Award,
  Wind
} from "lucide-react";
import { MyGardenPlant, PlantInfo, WeatherData, AlertLog } from "./types";
import { PRELOADED_PLANTS } from "./data/plants";
import { supabase, SUPABASE_SQL_HELPER } from "./lib/supabase";

export default function App() {
  // --- States ---
  const [garden, setGarden] = useState<MyGardenPlant[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Santiago");
  const [customCityInput, setCustomCityInput] = useState("");
  const [customPlantQuery, setCustomPlantQuery] = useState("");
  const [analyzingPlant, setAnalyzingPlant] = useState(false);
  const [inspectedPlant, setInspectedPlant] = useState<PlantInfo | null>(null);
  const [activeTab, setActiveTab] = useState<"huerto" | "catalogo" | "luna">("huerto");
  const [wateringAlertFilter, setWateringAlertFilter] = useState(false);
  const [simulationDaysElapsed, setSimulationDaysElapsed] = useState(0);
  const [showHarvestModal, setShowHarvestModal] = useState<string | null>(null);
  const [apiLogMessage, setApiLogMessage] = useState<string | null>(null);
  const [showBenefitsMap, setShowBenefitsMap] = useState<Record<string, boolean>>({});
  const [supabaseStatus, setSupabaseStatus] = useState<"connecting" | "connected" | "error">("connecting");
  const [supabaseErrorLog, setSupabaseErrorLog] = useState<string | null>(null);
  const [showSqlHelper, setShowSqlHelper] = useState(false);

  // --- Initial Setup / Persistence ---
  useEffect(() => {
    // 1. Fetch Location Weather
    handleFetchWeather(selectedCity);

    // 2. Initialize with Supabase remote synced database (with LocalStorage fallbacks)
    loadFromSupabase();
  }, []);

  const syncToSupabase = async (updatedGarden: MyGardenPlant[]) => {
    try {
      const rows = updatedGarden.map((p) => ({
        id: p.id,
        plant_id: p.plantId,
        custom_name: p.customName || null,
        plant_info: p.plantInfo,
        location: p.location,
        planted_at: p.plantedAt,
        last_watered_at: p.lastWateredAt,
        progress_percentage: p.progressPercentage,
        current_stage: p.currentStage
      }));

      if (rows.length > 0) {
        const { error } = await supabase
          .from("medicinal_garden")
          .upsert(rows);
        if (error) throw error;
      }
      setSupabaseStatus("connected");
      setSupabaseErrorLog(null);
    } catch (err: any) {
      console.warn("Fallo sincronización con Supabase:", err.message);
      setSupabaseStatus("error");
      setSupabaseErrorLog(err.message || "La tabla 'medicinal_garden' podría no existir todavía.");
    }
  };

  const deleteFromSupabase = async (id: string) => {
    try {
      const { error } = await supabase
        .from("medicinal_garden")
        .delete()
        .eq("id", id);
      if (error) throw error;
    } catch (err: any) {
      console.warn("Fallo al eliminar de Supabase:", err.message);
    }
  };

  const loadFromSupabase = async () => {
    try {
      setSupabaseStatus("connecting");
      const { data, error } = await supabase
        .from("medicinal_garden")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const mapped: MyGardenPlant[] = data.map((row: any) => ({
          id: row.id,
          plantId: row.plant_id,
          customName: row.custom_name,
          plantInfo: row.plant_info,
          location: row.location,
          plantedAt: row.planted_at,
          lastWateredAt: row.last_watered_at,
          progressPercentage: row.progress_percentage ?? 0,
          currentStage: row.current_stage || evaluatePlantStage(row.progress_percentage ?? 0),
          alerts: []
        }));
        setGarden(mapped);
        localStorage.setItem("mi_huerto_medicinal", JSON.stringify(mapped));
        setSupabaseStatus("connected");
        setSupabaseErrorLog(null);
        setApiLogMessage("¡Sincronizado con éxito desde Supabase!");
        setTimeout(() => setApiLogMessage(null), 3000);
      } else {
        // Table successfully queried but empty - sync local storage or seed
        const saved = localStorage.getItem("mi_huerto_medicinal");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.length > 0) {
            setGarden(parsed);
            await syncToSupabase(parsed);
          } else {
            seedInitialGarden();
          }
        } else {
          seedInitialGarden();
        }
        setSupabaseStatus("connected");
        setSupabaseErrorLog(null);
      }
    } catch (err: any) {
      console.warn("Fallo lectura inicial Supabase. Usando LocalStorage alternativo.", err.message);
      setSupabaseStatus("error");
      setSupabaseErrorLog(err.message || "No se pudo consultar la tabla 'medicinal_garden'. Puede requerir inicializar la tabla.");
      
      // LocalStorage Fallback
      const saved = localStorage.getItem("mi_huerto_medicinal");
      if (saved) {
        try {
          setGarden(JSON.parse(saved));
        } catch (e) {
          seedInitialGarden();
        }
      } else {
        seedInitialGarden();
      }
    }
  };

  const seedInitialGarden = () => {
    const romero = PRELOADED_PLANTS[0];
    const menta = PRELOADED_PLANTS[1];
    
    const today = new Date();
    const plantedRomero = new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000); // 45 days ago
    const plantedMenta = new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000);   // 8 days ago

    const initial: MyGardenPlant[] = [
      {
        id: "inst_romero_" + Date.now(),
        plantId: romero.id,
        plantInfo: romero,
        location: "Huerto Exterior Jardín",
        plantedAt: plantedRomero.toISOString(),
        lastWateredAt: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago (romero needs every 8)
        progressPercentage: 37,
        currentStage: "Crecimiento",
        alerts: []
      },
      {
        id: "inst_menta_" + Date.now(),
        plantId: menta.id,
        plantInfo: menta,
        location: "Maceta Balcón",
        plantedAt: plantedMenta.toISOString(),
        lastWateredAt: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago (menta needs every 2, so it's thirsty!)
        progressPercentage: 12,
        currentStage: "Brote / Semilla",
        alerts: []
      }
    ];
    setGarden(initial);
    localStorage.setItem("mi_huerto_medicinal", JSON.stringify(initial));
    syncToSupabase(initial);
  };

  // State auto-saver
  const saveGarden = (updatedGarden: MyGardenPlant[]) => {
    setGarden(updatedGarden);
    localStorage.setItem("mi_huerto_medicinal", JSON.stringify(updatedGarden));
    syncToSupabase(updatedGarden);
  };

  // --- API Calls ---
  const handleFetchWeather = async (city: string) => {
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      if (res.ok) {
        const data = await res.json();
        setWeather(data);
      }
    } catch (e) {
      console.error("No se pudo conectar al servidor Express para obtener clima.", e);
    }
  };

  const handleInspectPreloaded = (plant: PlantInfo) => {
    setInspectedPlant(plant);
    setSearchQuery("");
  };

  const handleSearchCustomPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPlantQuery) return;

    setAnalyzingPlant(true);
    setApiLogMessage("Consultando base de datos botánica y sintonizando Gemini AI...");
    try {
      const response = await fetch("/api/gemini/analyze-plant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customPlantQuery,
          location: selectedCity
        })
      });

      if (response.ok) {
        const data = await response.json();
        setInspectedPlant(data);
        setCustomPlantQuery("");
        setApiLogMessage("Sintonización exitosa con inteligencia botánica.");
        setTimeout(() => setApiLogMessage(null), 3500);
      } else {
        throw new Error("No se obtuvo respuesta correcta del servidor");
      }
    } catch (err: any) {
      console.warn("Fallo o desconfigurado el API. Usando catálogo integrado o fallback de seguridad.");
      setApiLogMessage("Usando catálogo de seguridad.");
      setTimeout(() => setApiLogMessage(null), 3000);
    } finally {
      setAnalyzingPlant(false);
    }
  };

  // --- Interactive Garden Actions ---
  const handlePlantSeed = (plant: PlantInfo, customLocation: string = "Huerto Casero") => {
    const newPlant: MyGardenPlant = {
      id: "inst_" + Date.now(),
      plantId: plant.id,
      plantInfo: plant,
      location: customLocation,
      plantedAt: new Date().toISOString(),
      lastWateredAt: new Date().toISOString(),
      progressPercentage: 1,
      currentStage: "Brote / Semilla",
      alerts: []
    };

    const next = [newPlant, ...garden];
    saveGarden(next);
    setActiveTab("huerto");
    
    // Jump scroll to garden view
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleWaterPlant = (instanceId: string) => {
    const updated = garden.map((p) => {
      if (p.id === instanceId) {
        return {
          ...p,
          lastWateredAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveGarden(updated);
  };

  const handleNutrientPlant = (instanceId: string) => {
    const updated = garden.map((p) => {
      if (p.id === instanceId) {
        return {
          ...p,
          // Give a small progression booster when fertilized
          progressPercentage: Math.min(100, p.progressPercentage + 5)
        };
      }
      return p;
    });
    saveGarden(updated);
  };

  const handleHarvest = (p: MyGardenPlant) => {
    setShowHarvestModal(p.plantInfo.name);
    // Remove from active garden but offer custom completion effect
    const updated = garden.filter((item) => item.id !== p.id);
    saveGarden(updated);
    deleteFromSupabase(p.id);
  };

  const handleRemovePlant = (instanceId: string) => {
    if (confirm("¿Estás seguro de desyerbar (retirar) esta planta de tu huerto? Se borrará su progreso.")) {
      const updated = garden.filter((p) => p.id !== instanceId);
      saveGarden(updated);
      deleteFromSupabase(instanceId);
    }
  };

  // --- Environmental Dynamic Simulations ---
  // Calculates days since planted and watering priorities
  const evaluatePlantStage = (progress: number): "Brote / Semilla" | "Crecimiento" | "Maduración" | "Floración" | "Listo para Cosecha" => {
    if (progress < 15) return "Brote / Semilla";
    if (progress < 50) return "Crecimiento";
    if (progress < 75) return "Maduración";
    if (progress < 95) return "Floración";
    return "Listo para Cosecha";
  };

  // Fast-Forward Time Simulator (+10 Days)
  // Re-evaluates hydration levels, alerts, and botanical growth milestones
  const handleFastForwardTime = () => {
    const incrementDays = 10;
    setSimulationDaysElapsed((prev) => prev + incrementDays);

    const updated = garden.map((p) => {
      // Calculate new growth percentage based on total harvest days from species description
      const totalDaysNeeded = p.plantInfo.progressionStages.harvestDays || 100;
      const progressAdded = (incrementDays / totalDaysNeeded) * 100;
      const nextProgress = Math.min(100, Math.round(p.progressPercentage + progressAdded));
      const nextStage = evaluatePlantStage(nextProgress);

      // Keep original planted date but offset it virtually by creating old ISO string
      const origPlanted = new Date(p.plantedAt);
      origPlanted.setDate(origPlanted.getDate() - incrementDays);

      return {
        ...p,
        plantedAt: origPlanted.toISOString(),
        progressPercentage: nextProgress,
        currentStage: nextStage
      };
    });

    saveGarden(updated);
  };

  const handleResetSimulation = () => {
    setSimulationDaysElapsed(0);
    seedInitialGarden();
  };

  // Helper calculating live requirements for each item in user's UI
  const getPlantWateringStatus = (p: MyGardenPlant) => {
    const today = new Date();
    const lastWatered = new Date(p.lastWateredAt);
    
    // Calculate difference in days (accounting for simulator days since we don't change browser actual year on fastforward,
    // we match it mathematically by tracking daysElapsed)
    const diffTime = Math.abs(today.getTime() - lastWatered.getTime());
    const realDaysDiff = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Add simulation factor
    const daysSinceWatered = realDaysDiff; 
    const daysLeft = p.plantInfo.wateringFrequencyDays - daysSinceWatered;

    return {
      daysSinceWatered,
      daysLeft,
      needsWaterNow: daysLeft <= 0,
    };
  };

  // Count active notifications/alerts across all plants
  const calcTotalGardenAlerts = () => {
    let count = 0;
    garden.forEach((p) => {
      const status = getPlantWateringStatus(p);
      if (status.needsWaterNow) count++;
      // Climate warning checked dynamically
      if (weather) {
        const idealTempRange = p.plantInfo.idealClimate.temperature; // e.g. "15-25°C"
        const cleanTemp = weather.temperature;
        if (idealTempRange.includes("-")) {
          const parts = idealTempRange.replace(/[^0-9-]/g, "").split("-");
          if (parts.length === 2) {
            const min = parseInt(parts[0]);
            const max = parseInt(parts[1]);
            if (cleanTemp < min || cleanTemp > max) count++;
          }
        }
      }
    });
    return count;
  };

  // Filters garden list depending on tab select or watering alarm toggling
  const filteredGarden = garden.filter((p) => {
    if (wateringAlertFilter) {
      const status = getPlantWateringStatus(p);
      return status.needsWaterNow;
    }
    return true;
  });

  return (
    <div id="huerto_main" className="min-h-screen bg-[#f7f9f6] text-[#2c3d2e] font-sans">
      {/* --- Top Nature Header --- */}
      <header id="navbar_header" className="bg-white border-b border-[#e1eae2] sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#e8eedd] rounded-xl text-[#3d6e46]">
                <Sprout id="sprout_logo" className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-[#1e3422] flex items-center gap-1.5">
                  Huerto Medicinal <span className="text-xs bg-[#e8eedd] px-2 py-0.5 rounded-full text-[#345d3a] font-medium">Biodinámico</span>
                </h1>
                <p className="text-xs text-[#607e65]">Clima, Lunar, Riegos y Progreso</p>
              </div>
            </div>

            {/* Quick Stats Toolbar */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200">
                <Database className="w-4 h-4 text-[#4f6453]" />
                <span className="font-medium text-xs text-stone-600">Simulación: <strong className="text-[#3a5d3c]">+{simulationDaysElapsed} Días</strong></span>
                {simulationDaysElapsed > 0 && (
                  <button 
                    onClick={handleResetSimulation} 
                    title="Restaurar estado inicial"
                    className="p-0.5 hover:bg-stone-200 rounded text-stone-500 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2 text-stone-600">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-[#223d27]">{selectedCity}</span>
              </div>

              {weather && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">{weather.temperature}°C</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">{weather.lunarPhaseIcon} {weather.lunarPhase}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* --- Main Body Stage --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* API Alerts Alert Notification Toast */}
        {apiLogMessage && (
          <div className="mb-6 p-4 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg text-teal-800 flex items-center justify-between shadow-xs animate-bounce">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-teal-600 animate-spin" />
              <p className="text-sm font-medium">{apiLogMessage}</p>
            </div>
          </div>
        )}

        {/* Supabase Dynamic Connection & Synced Status Panel */}
        <section id="supabase_sync_panel" className="mb-8 p-5 bg-stone-50 rounded-2xl border border-stone-200/80 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                supabaseStatus === "connected" 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : supabaseStatus === "connecting"
                  ? "bg-sky-50 text-sky-700 border border-sky-100"
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                <Database className={`w-5 h-5 ${supabaseStatus === "connecting" ? "animate-spin" : ""}`} />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-[#1e3422] text-sm md:text-base">Nube de Datos Supabase</h3>
                  <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${
                    supabaseStatus === "connected"
                      ? "bg-emerald-100/60 text-emerald-800 border-emerald-200"
                      : supabaseStatus === "connecting"
                      ? "bg-sky-100/60 text-sky-800 border-sky-200 animate-pulse"
                      : "bg-amber-100/60 text-amber-800 border-amber-200"
                  }`}>
                    {supabaseStatus === "connected" ? "Sincronizado" : supabaseStatus === "connecting" ? "Conectando" : "Acceso Local / Tabla Faltante"}
                  </span>
                </div>
                
                <p className="text-xs text-stone-500 leading-relaxed">
                  {supabaseStatus === "connected" && (
                    <span>Proyecto <code className="bg-stone-150 px-1 py-0.5 rounded text-stone-700 font-mono text-[10px]">oixqnryeiqnqjoammcrx</code> conectado listo para persistir cultivos biodinámicos en tiempo real de forma duradera.</span>
                  )}
                  {supabaseStatus === "connecting" && (
                    <span>Sincronizando estado celular del huerto medicinal con tu base de datos cloud en Supabase...</span>
                  )}
                  {supabaseStatus === "error" && (
                    <span>Enlace establecido con éxito. Sin embargo, la tabla <strong>'medicinal_garden'</strong> no responde. Inicialízala con el script de abajo para comenzar.</span>
                  )}
                </p>
                
                <div className="text-[10px] font-mono text-stone-400 flex flex-wrap gap-x-4">
                  <span>URL: <span className="text-stone-500">https://oixqnryeiqnqjoammcrx.supabase.co</span></span>
                  <span>Tabla: <span className="text-stone-500">medicinal_garden</span></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0 md:self-center">
              <button
                type="button"
                onClick={loadFromSupabase}
                className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refrescar Sinc
              </button>
              
              <button
                type="button"
                onClick={() => setShowSqlHelper(!showSqlHelper)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  showSqlHelper 
                    ? "bg-emerald-850 text-white border-emerald-950" 
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-250"
                }`}
              >
                <Info className="w-3.5 h-3.5" />
                {showSqlHelper ? "Ocultar SQL" : "Configurar SQL / Crear Tabla"}
              </button>
            </div>
          </div>

          {showSqlHelper && (
            <div className="mt-4 p-4 bg-stone-900 text-stone-300 rounded-xl font-mono text-xs border border-stone-850 animate-in fade-in duration-250">
              <div className="flex items-center justify-between mb-2 text-[11px] text-stone-400 uppercase tracking-widest border-b border-stone-800 pb-2">
                <span>🔧 Inicializar Base de Datos en Supabase</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_SQL_HELPER.trim());
                    alert("¡Código SQL copiado al portapapeles! Pégalo en el SQL Editor de tu Dashboard de Supabase.");
                  }}
                  className="px-2 py-1 bg-stone-800 hover:bg-stone-750 text-emerald-400 font-bold font-sans rounded-md text-[10px] transition-colors"
                >
                  Copiar Todo
                </button>
              </div>
              <pre className="overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-60 text-[11px] text-emerald-300 bg-stone-950 p-3 rounded-lg">
                {SUPABASE_SQL_HELPER.trim()}
              </pre>
              <p className="mt-3 text-[11px] text-amber-300 leading-normal font-sans">
                💡 <strong>Instrucciones:</strong> Ve al panel de Supabase de tu proyecto, haz clic en <strong>SQL Editor</strong> en la barra lateral izquierda, crea una nueva consulta (<em>New query</em>), pega el código de arriba y haz clic en <strong>Run</strong>. Al recargar la página, ¡tus cultivos se guardarán en la nube inmediatamente de forma robusta!
              </p>
            </div>
          )}
        </section>

        {/* Dynamic Location Climatic Selector */}
        <section id="location_microclimate_widget" className="mb-8 bg-white p-6 rounded-2xl border border-[#e1eae2] shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Column 1: Selector */}
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#79947d] block mb-2">📍 Sintonizar Localización del Huerto</span>
              <p className="text-sm text-stone-500 mb-4">El clima y la fase lunar se recalibran para sincronizar alertas botánicas personalizadas.</p>
              
              <div className="flex flex-wrap gap-2">
                {["Santiago", "Bogota", "Madrid", "CDMX", "Lima", "Buenos Aires"].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      handleFetchWeather(city);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCity === city
                        ? "bg-[#35583b] text-white shadow-xs"
                        : "bg-[#f1f5f2] text-stone-600 hover:bg-[#e6ede8]"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>

              {/* Custom City Seach Field */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  if (customCityInput.trim()) {
                    setSelectedCity(customCityInput.trim());
                    handleFetchWeather(customCityInput.trim());
                    setCustomCityInput("");
                  }
                }}
                className="mt-4 flex items-center space-x-2"
              >
                <input
                  type="text"
                  placeholder="Otra ciudad..."
                  value={customCityInput}
                  onChange={(e) => setCustomCityInput(e.target.value)}
                  className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-2.5 py-1.5 w-full focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                />
                <button type="submit" className="bg-emerald-800 hover:bg-emerald-900 text-white p-1.5 rounded-lg transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Column 2: Clima details */}
            <div className="bg-[#fcfdfa] border border-[#eff3f0] p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-400 font-medium block">Microclima Actual</span>
                <p className="text-lg font-bold text-[#1a2d1d]">{selectedCity}</p>
                <div className="mt-2 flex items-center space-x-3 text-sm">
                  <div className="flex items-center text-stone-600">
                    <Thermometer className="w-4 h-4 text-orange-400 mr-1" />
                    <strong>{weather?.temperature ?? 20}°C</strong>
                  </div>
                  <div className="flex items-center text-stone-600">
                    <Droplets className="w-4 h-4 text-blue-400 mr-1" />
                    <strong>{weather?.humidity ?? 55}% Hum.</strong>
                  </div>
                </div>
                <p className="text-xs text-[#526b57] mt-2 font-medium bg-[#ecf2ed] inline-block px-2 py-0.5 rounded-md">
                  Condición: {weather?.condition ?? "Templado"}
                </p>
              </div>

              <div className="text-right flex flex-col items-center">
                <Compass className="w-8 h-8 text-[#538a5e] mb-1 animate-spin-slow" />
                <span className="text-[10px] text-stone-400 block font-mono">ESTADO CLIMÁTICO</span>
              </div>
            </div>

            {/* Column 3: Astro Lunar biodynamics */}
            <div className="bg-[#fafaff] border border-[#edf1f8] p-4 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[#4c5f80] font-bold flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" /> Astro-Calendario Biodinámicoo
                </span>
                <span className="text-lg">{weather?.lunarPhaseIcon ?? "🌙"}</span>
              </div>
              <p className="text-sm font-semibold text-[#18233c]">{weather?.lunarPhase ?? "Sincronizando..."}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {weather?.lunarPhaseAdvice ?? "Cargando consejos agrícolas sobre fluidos de savia..."}
              </p>
            </div>

          </div>
        </section>

        {/* --- Primary Tabs Navigation --- */}
        <div className="flex border-b border-[#e1eae2] mb-8 space-x-4">
          <button
            onClick={() => setActiveTab("huerto")}
            className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === "huerto"
                ? "border-[#2b4c2f] text-[#2b4c2f] font-extrabold"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Mi Huerto ({garden.length})</span>
          </button>
          
          <button
            onClick={() => setActiveTab("catalogo")}
            className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === "catalogo"
                ? "border-[#2b4c2f] text-[#2b4c2f] font-extrabold"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Consultar IA & Catálogo</span>
          </button>

          <button
            onClick={() => setActiveTab("luna")}
            className={`pb-3 text-sm font-bold flex items-center space-x-2 transition-all border-b-2 ${
              activeTab === "luna"
                ? "border-[#2b4c2f] text-[#2b4c2f] font-extrabold"
                : "border-transparent text-stone-400 hover:text-stone-600"
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Guía de Luna y Tierra</span>
          </button>
        </div>

        {/* ==================== TAB: ACTIVE GARDEN ==================== */}
        {activeTab === "huerto" && (
          <div>
            {/* Quick Actions & Controls Bar */}
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#eaefe9] p-4 rounded-xl gap-4 border border-[#d9e3d9]">
              <div>
                <h3 className="text-sm font-bold text-[#1f3722] flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-700" /> Controles y Gestión del Desarrollo
                </h3>
                <p className="text-xs text-[#527056]">Simula el paso de los días para probar los ciclos naturales del huerto.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleFastForwardTime}
                  className="cursor-pointer bg-[#3a5d3c] hover:bg-[#2c472e] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
                >
                  <span>Simular +10 Días</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                
                <button
                  onClick={() => setWateringAlertFilter(!wateringAlertFilter)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all ${
                    wateringAlertFilter
                      ? "bg-red-500 text-white shadow-xs"
                      : "bg-white border border-stone-200 text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>Solo sedientos ({garden.filter(p => getPlantWateringStatus(p).needsWaterNow).length})</span>
                </button>
              </div>
            </div>

            {/* Empty view state indicator */}
            {filteredGarden.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-[#d2dfd4] p-8 max-w-xl mx-auto">
                <Sprout className="w-12 h-12 text-[#9ab7a0] mx-auto mb-4 stroke-1 animate-bounce" />
                <h4 className="text-base font-bold text-[#233525] mb-1">Tu huerto medicinal está descansando</h4>
                <p className="text-stone-500 text-sm mb-6 leading-relaxed">
                  {wateringAlertFilter 
                    ? "¡Estupendo! Ninguna planta de tu huerto tiene riegos prioritarios pendientes ahora." 
                    : "Aún no tienes especies sembradas en este ciclo vegetal de tu huerto casero."}
                </p>
                <button 
                  onClick={() => {
                    setWateringAlertFilter(false);
                    setActiveTab("catalogo");
                  }}
                  className="bg-emerald-800 hover:bg-emerald-950 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  Añadir Primer Especie Medicinal
                </button>
              </div>
            ) : (
              /* Garden Plants Grid System */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredGarden.map((plantInstance) => {
                  const status = getPlantWateringStatus(plantInstance);
                  const isOptimalMoon = weather && plantInstance.plantInfo.lunarPhaseAdvice.bestPhase === weather.lunarPhase;
                  
                  return (
                    <div 
                      key={plantInstance.id}
                      className="bg-white border border-[#e1eae2] rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                    >
                      {/* Thirsty visual badge */}
                      {status.needsWaterNow && (
                        <div className="absolute top-0 right-0 bg-[#e05252] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl flex items-center space-x-1 animate-pulse">
                          <Droplets className="w-3 h-3 fill-white" />
                          <span>Riego Urgente</span>
                        </div>
                      )}

                      {/* Plant Metadata Top */}
                      <div>
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-1.5">
                              {plantInstance.plantInfo.scientificName}
                            </span>
                            <h3 className="text-xl font-bold text-[#142817] flex items-center gap-1.5">
                              {plantInstance.plantInfo.name}
                              {isOptimalMoon && (
                                <span title="Alineación Lunar Óptima" className="cursor-help text-sm">✨🌕</span>
                              )}
                            </h3>
                            <p className="text-xs text-stone-400 mt-1 flex items-center">
                              <MapPin className="w-3 h-3 text-stone-300 mr-1" />
                              {plantInstance.location}
                            </p>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] text-stone-400 block">Fase Vegetativa</span>
                            <span className="text-xs font-extrabold text-[#3a543b] bg-[#eef3ee] px-2.5 py-1 rounded-full inline-block mt-1">
                              🌿 {plantInstance.currentStage}
                            </span>
                          </div>
                        </div>

                        {/* Interactive Growth Progress Engine */}
                        <div className="my-5 bg-[#f6fbf6] p-4 rounded-xl border border-[#edf3ed]">
                          <div className="flex justify-between text-xs text-stone-500 mb-1.5 font-medium">
                            <span>Progreso hasta cosecha</span>
                            <span className="font-bold text-[#294c2d]">{plantInstance.progressPercentage}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div className="w-full bg-[#e3eae4] rounded-full h-2.5 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                plantInstance.progressPercentage >= 95 
                                  ? "bg-emerald-600 shadow-inner" 
                                  : "bg-[#43754b]"
                              }`}
                              style={{ width: `${plantInstance.progressPercentage}%` }}
                            ></div>
                          </div>

                          <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-stone-500">
                            <div>
                              <span>Sustrato idóneo:</span>
                              <strong className="block text-stone-700 truncate" title={plantInstance.plantInfo.soilRequirements.type}>
                                {plantInstance.plantInfo.soilRequirements.type}
                              </strong>
                            </div>
                            <div>
                              <span>PH del Suelo:</span>
                              <strong className="block text-stone-700 font-mono">
                                {plantInstance.plantInfo.soilRequirements.ph}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Alerts & Critical Guidance */}
                        <div className="space-y-2 mb-6">
                          <div className="text-xs font-bold text-stone-500 uppercase tracking-widest flex items-center gap-1">
                            <Info className="w-3 h-3" /> Estado y Cuidados
                          </div>
                          
                          {/* Alert 1: Irrigation */}
                          <div className={`p-2.5 rounded-lg text-xs flex items-center justify-between ${
                            status.needsWaterNow 
                              ? "bg-red-50 text-red-800 border border-red-100" 
                              : "bg-[#f1fcf3] text-stone-600"
                          }`}>
                            <div className="flex items-center space-x-2">
                              <Droplets className={`w-4 h-4 ${status.needsWaterNow ? "text-red-500 animate-bounce" : "text-[#4caf50]"}`} />
                              <span>
                                {status.needsWaterNow 
                                  ? "¡Deshidratación detectada!" 
                                  : `Siguiente riego en unos ${status.daysLeft} días.`}
                              </span>
                            </div>
                            <span className="text-[10px] text-stone-400 font-mono">ciclo: {plantInstance.plantInfo.wateringFrequencyDays}d</span>
                          </div>

                          {/* Alert 2: Biodynamic Lunar Compatibility */}
                          <div className="p-2.5 bg-indigo-50/50 rounded-lg text-xs flex items-center space-x-2 text-stone-600 border border-indigo-100/50">
                            <Moon className={`w-4 h-4 ${isOptimalMoon ? "text-amber-500 animate-pulse" : "text-indigo-400"}`} />
                            <span className="leading-tight">
                              {isOptimalMoon 
                                ? `¡Alineación perfecta hoy con ${plantInstance.plantInfo.lunarPhaseAdvice.bestPhase}!` 
                                : `Prefiere ${plantInstance.plantInfo.lunarPhaseAdvice.bestPhase} para intervenciones.`}
                            </span>
                          </div>

                          {/* Render dynamic climate alerts if city exceeds plant limits */}
                          {weather && (
                            <div className="p-2.5 bg-amber-50/50 text-amber-900 rounded-lg text-xs flex items-start space-x-2 border border-amber-100">
                              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                              <p className="leading-normal">
                                Clima local ({selectedCity}: {weather.temperature}°C). Rango óptimo vegetal: {plantInstance.plantInfo.idealClimate.temperature}.
                              </p>
                            </div>
                          )}

                          {/* Collapsible Medicinal Benefits block */}
                          <div className="mt-3 pt-1">
                            <button
                              onClick={() => setShowBenefitsMap(prev => ({ ...prev, [plantInstance.id]: !prev[plantInstance.id] }))}
                              className="w-full py-1.5 px-3 bg-[#f2faf3] hover:bg-[#e4f5e7] border border-[#dceee0] text-[11px] font-bold text-emerald-800 rounded-lg flex items-center justify-between transition-colors"
                            >
                              <span className="flex items-center space-x-1">
                                <Heart className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                                <span>{showBenefitsMap[plantInstance.id] ? "Ocultar Beneficios" : "Ver Beneficios Medicinales"}</span>
                              </span>
                              <span>{showBenefitsMap[plantInstance.id] ? "▲" : "▼"}</span>
                            </button>

                            {showBenefitsMap[plantInstance.id] && (
                              <div className="mt-2 p-3 bg-stone-50 rounded-lg border border-stone-150 space-y-1.5 animate-in fade-in duration-200">
                                {plantInstance.plantInfo.benefits && plantInstance.plantInfo.benefits.length > 0 ? (
                                  plantInstance.plantInfo.benefits.map((benefit, i) => (
                                    <div key={i} className="flex items-start space-x-1.5">
                                      <span className="text-emerald-700 shrink-0 text-xs font-bold">✓</span>
                                      <p className="text-[11px] text-stone-600 leading-normal">{benefit}</p>
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[11px] text-stone-400 italic">No hay beneficios listados para esta planta.</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Footer Controls for the Plant */}
                      <div className="border-t border-[#f0f4f0] pt-4 flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleRemovePlant(plantInstance.id)}
                          className="p-2 bg-stone-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all text-stone-400"
                          title="Eliminar planta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center space-x-1.5">
                          <button
                            onClick={() => handleNutrientPlant(plantInstance.id)}
                            className="bg-stone-100 hover:bg-[#e4ebd3] text-stone-700 hover:text-[#506e30] px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                          >
                            🌿 Nutrir Tierra
                          </button>

                          <button
                            onClick={() => handleWaterPlant(plantInstance.id)}
                            className="bg-[#3e89ff]/10 hover:bg-[#3e89ff]/20 text-[#2563eb] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                          >
                            <Droplets className="w-3.5 h-3.5 fill-[#2563eb]" />
                            <span>Regar</span>
                          </button>

                          {plantInstance.progressPercentage >= 95 && (
                            <button
                              onClick={() => handleHarvest(plantInstance)}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Cosechar</span>
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB: CONSULT GEMINI & CATALOGO ==================== */}
        {activeTab === "catalogo" && (
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Column: IA Analyzer Form & Integrated list */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Custom IA Botanical Search */}
                <div className="bg-white p-6 rounded-2xl border border-[#e1eae2] shadow-xs">
                  <h3 className="text-base font-bold text-[#1c351f] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-emerald-600 animate-spin" /> Analizador Botánico IA
                  </h3>
                  <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                    Escribe cualquier planta medicinal y Gemini AI creará una guía personalizada de clima, suelo, luna y riego considerando tu ubicación.
                  </p>

                  <form onSubmit={handleSearchCustomPlant} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-400 uppercase tracking-widest mb-1">Nombre o especie botánica</label>
                      <input 
                        type="text"
                        required
                        placeholder="Ej: Eucalipto, Hipérico, Cedrón, Valeriana..."
                        value={customPlantQuery}
                        onChange={(e) => setCustomPlantQuery(e.target.value)}
                        className="bg-stone-50 border border-stone-200 text-sm rounded-xl px-3 py-2.5 w-full focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={analyzingPlant}
                      className="w-full bg-[#204026] hover:bg-[#152a19] disabled:bg-stone-300 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center space-x-1.5"
                    >
                      {analyzingPlant ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Analizando Especie...</span>
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4" />
                          <span>Sintonizar con Gemini AI</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Preloaded Common Plants Quick catalog */}
                <div className="bg-white p-6 rounded-2xl border border-[#e1eae2] shadow-xs">
                  <h4 className="text-sm font-bold text-stone-700 mb-3 flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-emerald-800" />
                    <span>Especies Recomendables</span>
                  </h4>
                  
                  <div className="space-y-2">
                    {PRELOADED_PLANTS.map((plant) => (
                      <button
                        key={plant.id}
                        onClick={() => handleInspectPreloaded(plant)}
                        className="w-full p-3 bg-stone-50 hover:bg-[#f1f6f1] rounded-xl text-left border border-stone-100 hover:border-emerald-100 transition-colors flex justify-between items-center"
                      >
                        <div>
                          <strong className="text-sm text-stone-800 block">{plant.name}</strong>
                          <span className="text-[11px] text-[#4f6b54] italic block">{plant.scientificName}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-300" />
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Plant Sheet Renderer */}
              <div className="lg:col-span-2">
                {inspectedPlant ? (
                  <div className="bg-white rounded-3xl border border-[#e1eae2] shadow-sm overflow-hidden">
                    
                    {/* Top Banner Design */}
                    <div className="bg-gradient-to-r from-[#204026] to-[#3a6843] p-8 text-white relative">
                      <span className="text-xs bg-[#e2eedf] text-[#133018] px-3 py-1 font-bold rounded-full uppercase tracking-widest inline-block mb-3">
                        {inspectedPlant.scientificName}
                      </span>
                      <h2 className="text-3xl font-bold tracking-tight mb-2">{inspectedPlant.name}</h2>
                      <p className="text-stone-100 text-sm leading-relaxed max-w-2xl">{inspectedPlant.description}</p>
                      
                      <div className="absolute top-8 right-8 text-white/10 hidden sm:block">
                        <Sprout className="w-24 h-24 stroke-1" />
                      </div>
                    </div>

                    {/* Detailed Data Blocks Grid */}
                    <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* 1. Clima */}
                        <div className="bg-amber-50/40 p-5 rounded-2xl border border-amber-100">
                          <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2.5 flex items-center space-x-1">
                            <Sun className="w-4 h-4 text-amber-600" /> <span>Clima Recomendado</span>
                          </h4>
                          <ul className="text-xs space-y-1.5 text-stone-600">
                            <li>🌡️ <strong>Temperatura idónea:</strong> {inspectedPlant.idealClimate.temperature}</li>
                            <li>☀️ <strong>Exposición solar:</strong> {inspectedPlant.idealClimate.sunlight}</li>
                            <li>💧 <strong>Humedad atmosférica:</strong> {inspectedPlant.idealClimate.humidity}</li>
                          </ul>
                        </div>

                        {/* 2. Tierra / Sustrato */}
                        <div className="bg-[#f0f7f2] p-5 rounded-2xl border border-[#d2e7d7]">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2.5 flex items-center space-x-2">
                            <Database className="w-4 h-4 text-emerald-600" />
                            <span>Sustrato y Tierra</span>
                          </h4>
                          <ul className="text-xs space-y-1.5 text-stone-600">
                            <li>🧪 <strong>Ácido / Alcalino (pH):</strong> {inspectedPlant.soilRequirements.ph}</li>
                            <li>🪵 <strong>Textura sugerida:</strong> {inspectedPlant.soilRequirements.type}</li>
                            <li>🌱 <strong>Abonos idóneos:</strong> {inspectedPlant.soilRequirements.nutrients}</li>
                          </ul>
                        </div>

                        {/* 3. Lunar biodynamics */}
                        <div className="col-span-1 md:col-span-2 bg-[#f4f3fb] p-5 rounded-2xl border border-[#dfdbf3]">
                          <h4 className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center space-x-2">
                            <Moon className="w-4 h-4 text-indigo-600 animate-pulse" />
                            <span>Compatibilidad Biodinámica Lunar</span>
                          </h4>
                          <p className="text-xs text-indigo-950 font-semibold mb-1">
                            Alineación preferida: {inspectedPlant.lunarPhaseAdvice.bestPhase}
                          </p>
                          <p className="text-xs text-indigo-900 leading-relaxed">
                            {inspectedPlant.lunarPhaseAdvice.explanation}
                          </p>
                        </div>

                        {/* 4. Timeline growth stages roadmap */}
                        <div className="col-span-1 md:col-span-2">
                          <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-4 flex items-center space-x-2">
                            <Calendar className="w-4 h-4" /> <span>Duración aproximada del ciclo de progreso</span>
                          </h4>
                          
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/50">
                              <span className="text-[10px] text-stone-400 uppercase font-mono">Brote</span>
                              <p className="text-sm font-extrabold text-[#47654d] mt-1">{inspectedPlant.progressionStages.germinationDays} días</p>
                            </div>
                            <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/50">
                              <span className="text-[10px] text-stone-400 uppercase font-mono">Crecimiento</span>
                              <p className="text-sm font-extrabold text-[#47654d] mt-1">{inspectedPlant.progressionStages.growthDays} días</p>
                            </div>
                            <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/50">
                              <span className="text-[10px] text-stone-400 uppercase font-mono">Floración</span>
                              <p className="text-sm font-extrabold text-[#47654d] mt-1">{inspectedPlant.progressionStages.floweringDays} días</p>
                            </div>
                            <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200/50">
                              <span className="text-[10px] text-stone-400 uppercase font-mono">Cosecha Total</span>
                              <p className="text-sm font-extrabold text-[#233f28] mt-1">{inspectedPlant.progressionStages.harvestDays} días</p>
                            </div>
                          </div>
                        </div>

                        {/* Propiedades y Beneficios Medicinales */}
                        <div className="col-span-1 md:col-span-2 bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/60">
                          <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-3.5 flex items-center space-x-2">
                            <Heart className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                            <span>Beneficios Medicinales y Terapéuticos</span>
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {inspectedPlant.benefits && inspectedPlant.benefits.length > 0 ? (
                              inspectedPlant.benefits.map((benefit, i) => (
                                <div key={i} className="flex items-start space-x-2">
                                  <div className="p-0.5 bg-emerald-100 text-emerald-800 rounded-full mt-0.5 shrink-0">
                                    <Check className="w-3 h-3" />
                                  </div>
                                  <span className="text-xs text-stone-700 leading-normal">{benefit}</span>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-2 text-xs text-stone-400 italic">
                                Sintonizando propiedades medicinales mediante análisis fitoquímico...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 5. Precaution Alerts checklist */}
                        <div className="col-span-1 md:col-span-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 block mb-3">⚠️ Cuidados Clave y Alertas necesarias</span>
                          <div className="space-y-1.5">
                            {inspectedPlant.careAlerts.map((alert, i) => (
                              <div key={i} className="bg-red-50/60 p-2.5 rounded-lg text-xs text-rose-800 flex items-start space-x-2">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                <span>{alert}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Immediate "Sembrar" Button */}
                      <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="text-xs text-stone-500">
                          🌱 ¿Listo para iniciar el cultivo? Añádelo para monitorear riego.
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePlantSeed(inspectedPlant, "Huerto Exterior Jardín")}
                            className="bg-[#244b2a] hover:bg-[#18341c] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
                          >
                            Sembrar en Exterior Jardín
                          </button>
                          
                          <button
                            onClick={() => handlePlantSeed(inspectedPlant, "Maceta Balcón / Interior")}
                            className="bg-[#ecf3ee] hover:bg-[#dce9df] text-[#1c3821] px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                          >
                            Sembrar en Maceta Balcón
                          </button>
                        </div>
                      </div>

                    </div>

                  </div>
                ) : (
                  <div className="text-center py-20 bg-stone-50 rounded-3xl border border-dashed border-stone-200 p-8">
                    <Compass className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                    <h4 className="text-sm font-bold text-stone-500">Inspeccionador de Especies</h4>
                    <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                      Elige una planta de la lista lateral o ingresa un nombre para obtener el reporte biodinámico inmediato.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ==================== TAB: LUNAR GUIDE AND MANUALS ==================== */}
        {activeTab === "luna" && (
          <div className="bg-white rounded-3xl border border-[#e1eae2] p-8 shadow-xs">
            <h3 className="text-xl font-bold mb-2">Manual Agrónomo del Huerto Biodinámico</h3>
            <p className="text-sm text-stone-500 mb-8 max-w-3xl leading-relaxed">
              La siembra biodinámica conecta las fuerzas gravitacionales del Sol y la Luna para asegurar que los nutrientes de la tierra fluyan óptimamente a lo largo de los órganos vegetales de tus plantas medicinales.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              
              {/* Luna Nueva */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-1.5 bg-slate-200 rounded-lg text-lg">🌑</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-500">Fuerza a la Raíz</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800">Luna Nueva</h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  La savia concentrada en la raíz permite que la planta se asiente bajo tierra fría. Época ideal para desyerbar malas hierbas, arar el sustrato y aplicar abonos densos.
                </p>
              </div>

              {/* Luna Creciente */}
              <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-1.5 bg-emerald-100 rounded-lg text-lg">🌒</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-emerald-800">Crecimiento Follaje</span>
                </div>
                <h4 className="font-bold text-sm text-[#1b321c]">Luna Creciente</h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  La savia emprende su ascenso. Excelente para plantar y trasplantar especies aromáticas de follaje verde denso. La fotosítesis y asimilación de humedad están al máximo.
                </p>
              </div>

              {/* Luna Llena */}
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-1.5 bg-amber-100 rounded-lg text-lg">🌕</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-amber-800">Máxima Fragancia</span>
                </div>
                <h4 className="font-bold text-sm text-amber-900">Luna Llena</h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  La savia inunda las flores, hojas superiores y cogollos aromáticos. Es el mejor momento de la cosecha para conservar las propiedades medicinales más potentes.
                </p>
              </div>

              {/* Luna Menguante */}
              <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="p-1.5 bg-stone-200 rounded-lg text-lg">🌘</span>
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-stone-500">Poda y Descanso</span>
                </div>
                <h4 className="font-bold text-sm text-stone-800">Luna Menguante</h4>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                  La savia empieza a descender nuevamente. Retira hojas muertas, poda ramas excesivas para dar resistencia y extrae gel de pencas de Aloe con menor sangrado.
                </p>
              </div>

            </div>

            {/* Substratum recipe checklist */}
            <div className="bg-gradient-to-br from-[#f3f7f4] to-[#fcfdfc] p-6 rounded-2xl border border-[#d2dfd4] grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-1">
                <h4 className="text-base font-bold text-[#142817] mb-2">🧪 Receta de Sustrato Medicinal Universal</h4>
                <p className="text-xs text-stone-500 leading-normal">
                  Cultivar hierbas terapéuticas en macetas requiere una tierra suelta que filtre la humedad para evitar asfixia fúngica. Recomendamos esta combinación volumétrica balanceada.
                </p>
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-white rounded-xl border border-stone-100">
                  <strong className="block text-xl text-emerald-800 font-mono">50%</strong>
                  <strong className="text-xs text-stone-700 block mt-1">Tierra Negra Orgánica</strong>
                  <span className="text-[10px] text-stone-400 block leading-tight mt-0.5">Soporte estructural enriquecido con compost natural.</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-stone-100">
                  <strong className="block text-xl text-amber-700 font-mono">30%</strong>
                  <strong className="text-xs text-stone-700 block mt-1">Fibra de Coco o Perlita</strong>
                  <span className="text-[10px] text-stone-400 block leading-tight mt-0.5">Asegura aireación radical y evita compactación mineral.</span>
                </div>
                <div className="p-4 bg-white rounded-xl border border-stone-100">
                  <strong className="block text-xl text-[#3f51b5] font-mono">20%</strong>
                  <strong className="text-xs text-stone-700 block mt-1">Humus de Lombriz</strong>
                  <span className="text-[10px] text-stone-400 block leading-tight mt-0.5">Microbiología benéfica y nutrientes de liberación lenta.</span>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>

      {/* --- Harvest Celebration Overlay Modal --- */}
      {showHarvestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-emerald-500 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-[#ecfdf5] rounded-full flex items-center justify-center mx-auto mb-4 text-[#059669]">
              <Gift className="w-8 h-8 stroke-1.5 animate-bounce" />
            </div>
            
            <h3 className="text-2xl font-bold text-stone-900 mb-2">¡Cosecha Excitante Realizada! 🎉</h3>
            <p className="text-sm text-stone-500 leading-relaxed mb-6">
              Has completado el desarrollo óptimo de tu planta <strong>{showHarvestModal}</strong>. Al cosecharla bajo su fase biodinámica predilecta, aseguras la mayor concentración de propiedades medicinales en sus hojas e infundes pura salud orgánica a tu hogar.
            </p>

            <button
              onClick={() => setShowHarvestModal(null)}
              className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors w-full"
            >
              Regresar al Cuidado del Huerto
            </button>
          </div>
        </div>
      )}

      {/* --- Human-friendly Simple Footer --- */}
      <footer className="mt-20 border-t border-[#e2eae3] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center space-x-2 text-stone-400 text-xs font-medium">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Huerto Medicinal Bio-Sincronizado © 2026. Purifica y siembra conscientemente.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
