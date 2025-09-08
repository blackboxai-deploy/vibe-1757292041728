export type NutrientType = 'nitrogen' | 'phosphorus' | 'potassium' | 'calcium' | 'magnesium' | 'sulfur' | 'micronutrients';
export type FertigationStatus = 'idle' | 'mixing' | 'injecting' | 'flushing' | 'error' | 'maintenance';
export type PumpStatus = 'off' | 'on' | 'priming' | 'error';

export interface Nutrient {
  id: string;
  name: string;
  type: NutrientType;
  concentration: number; // % ou ppm
  unit: string;
  stockLevel: number; // litros ou kg
  minStock: number;
  maxStock: number;
  cost: number; // por unidade
  supplier?: string;
  expiryDate?: Date;
  enabled: boolean;
}

export interface FertigationRecipe {
  id: string;
  name: string;
  description?: string;
  cropType: string;
  growthStage: string;
  nutrients: RecipeNutrient[];
  targetPH: number;
  targetEC: number; // mS/cm
  waterVolume: number; // litros
  mixingTime: number; // minutos
  injectionRate: number; // ml/min
  created: Date;
  lastUsed?: Date;
  totalUses: number;
  enabled: boolean;
}

export interface RecipeNutrient {
  nutrientId: string;
  quantity: number; // ml ou g
  unit: string;
  order: number; // ordem de adição
}

export interface FertigationPump {
  id: string;
  name: string;
  nutrientId: string;
  status: PumpStatus;
  flowRate: number; // ml/min
  maxPressure: number; // bar
  currentVolume: number; // volume bombeado na sessão atual
  totalVolume: number; // volume total bombeado
  mqttTopic: string;
  calibrationFactor: number;
  lastMaintenance?: Date;
  enabled: boolean;
}

export interface FertigationSession {
  id: string;
  recipeId: string;
  zoneIds: string[];
  startTime: Date;
  endTime?: Date;
  status: FertigationStatus;
  targetPH: number;
  targetEC: number;
  actualPH?: number;
  actualEC?: number;
  waterUsed: number; // litros
  nutrientsUsed: SessionNutrient[];
  mixingTime: number; // minutos
  injectionTime: number; // minutos
  cost: number;
  notes?: string;
  triggeredBy: 'manual' | 'schedule' | 'automation';
}

export interface SessionNutrient {
  nutrientId: string;
  plannedQuantity: number;
  actualQuantity: number;
  unit: string;
  cost: number;
}

export interface FertigationControl {
  action: 'start' | 'stop' | 'pause' | 'resume' | 'flush';
  recipeId?: string;
  zoneIds?: string[];
  overrides?: {
    targetPH?: number;
    targetEC?: number;
    injectionRate?: number;
  };
  userId?: string;
  reason?: string;
}

export interface WaterQualityReading {
  id: string;
  timestamp: Date;
  ph: number;
  ec: number; // mS/cm
  temperature: number; // °C
  tds: number; // ppm
  location: 'source' | 'mixed' | 'injected';
  sessionId?: string;
}