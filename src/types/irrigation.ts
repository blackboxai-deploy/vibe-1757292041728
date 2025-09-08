export type IrrigationMode = 'manual' | 'automatic' | 'scheduled' | 'sensor_based';
export type ValveStatus = 'open' | 'closed' | 'opening' | 'closing' | 'error';
export type IrrigationStatus = 'idle' | 'active' | 'paused' | 'error';

export interface IrrigationZone {
  id: string;
  name: string;
  description?: string;
  area: number; // área em m²
  cropType?: string;
  soilType?: string;
  valveId: string;
  sensorIds: string[]; // sensores associados à zona
  enabled: boolean;
  waterRequirement: number; // mm/dia
  lastIrrigation?: Date;
  totalWaterUsed: number; // litros
}

export interface IrrigationValve {
  id: string;
  name: string;
  zoneId: string;
  status: ValveStatus;
  flowRate: number; // L/min
  maxPressure: number; // bar
  mqttTopic: string;
  position: number; // 0-100% abertura
  lastOperated: Date;
  enabled: boolean;
  maintenanceDate?: Date;
}

export interface IrrigationSchedule {
  id: string;
  name: string;
  zoneIds: string[];
  startTime: string; // HH:MM
  duration: number; // minutos
  daysOfWeek: number[]; // 0-6 (domingo-sábado)
  enabled: boolean;
  mode: IrrigationMode;
  conditions?: IrrigationCondition[];
  created: Date;
  lastRun?: Date;
}

export interface IrrigationCondition {
  sensorId: string;
  operator: 'less_than' | 'greater_than' | 'equals' | 'between';
  value: number;
  secondValue?: number; // para 'between'
  logicalOperator?: 'and' | 'or';
}

export interface IrrigationSession {
  id: string;
  zoneId: string;
  scheduleId?: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutos
  waterUsed: number; // litros
  mode: IrrigationMode;
  triggeredBy: 'manual' | 'schedule' | 'sensor' | 'automation';
  status: IrrigationStatus;
  notes?: string;
}

export interface IrrigationControl {
  zoneId: string;
  action: 'start' | 'stop' | 'pause' | 'resume';
  duration?: number; // minutos
  mode: IrrigationMode;
  userId?: string;
  reason?: string;
}