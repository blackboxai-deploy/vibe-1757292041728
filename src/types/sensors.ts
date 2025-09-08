export type SensorType = 
  | 'soil_moisture' 
  | 'soil_temperature' 
  | 'air_temperature' 
  | 'air_humidity' 
  | 'water_ph' 
  | 'water_ec' 
  | 'water_pressure' 
  | 'tank_level'
  | 'flow_rate';

export type SensorStatus = 'online' | 'offline' | 'warning' | 'error';

export interface SensorReading {
  id: string;
  sensorId: string;
  value: number;
  unit: string;
  timestamp: Date;
  quality: 'good' | 'poor' | 'bad';
}

export interface Sensor {
  id: string;
  name: string;
  type: SensorType;
  location: string;
  zone?: string;
  status: SensorStatus;
  lastReading?: SensorReading;
  minValue: number;
  maxValue: number;
  warningMin: number;
  warningMax: number;
  criticalMin: number;
  criticalMax: number;
  unit: string;
  mqttTopic: string;
  calibrationOffset?: number;
  enabled: boolean;
  lastUpdate: Date;
}

export interface SensorAlert {
  id: string;
  sensorId: string;
  type: 'warning' | 'critical' | 'offline';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  value?: number;
}

export interface SensorHistoryFilter {
  sensorId?: string;
  startDate: Date;
  endDate: Date;
  interval?: 'minute' | 'hour' | 'day';
}