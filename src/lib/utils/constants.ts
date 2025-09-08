// MQTT Topics
export const MQTT_TOPICS = {
  // Irrigation Control
  IRRIGATION: {
    VALVE_CONTROL: 'irrigation/control/valve',
    ZONE_STATUS: 'irrigation/status/zone',
    FLOW_RATE: 'irrigation/sensors/flow',
    PRESSURE: 'irrigation/sensors/pressure',
  },
  
  // Fertigation Control
  FERTIGATION: {
    PUMP_CONTROL: 'fertigation/control/pump',
    MIXER_CONTROL: 'fertigation/control/mixer',
    RECIPE_START: 'fertigation/control/recipe/start',
    RECIPE_STOP: 'fertigation/control/recipe/stop',
    STATUS: 'fertigation/status/system',
  },
  
  // Sensors
  SENSORS: {
    SOIL_MOISTURE: 'sensors/soil/moisture',
    SOIL_TEMPERATURE: 'sensors/soil/temperature',
    AIR_TEMPERATURE: 'sensors/environment/temperature',
    AIR_HUMIDITY: 'sensors/environment/humidity',
    WATER_PH: 'sensors/water/ph',
    WATER_EC: 'sensors/water/ec',
    WATER_PRESSURE: 'sensors/water/pressure',
    TANK_LEVEL: 'sensors/tank/level',
    FLOW_RATE: 'sensors/flow/rate',
  },
  
  // System Status
  SYSTEM: {
    STATUS_IRRIGATION: 'system/status/irrigation',
    STATUS_FERTIGATION: 'system/status/fertigation',
    ALERTS_CRITICAL: 'system/alerts/critical',
    ALERTS_WARNING: 'system/alerts/warning',
    HEARTBEAT: 'system/heartbeat',
  },
} as const;

// Sensor Configuration
export const SENSOR_UNITS = {
  SOIL_MOISTURE: '%',
  SOIL_TEMPERATURE: '°C',
  AIR_TEMPERATURE: '°C',
  AIR_HUMIDITY: '%',
  WATER_PH: 'pH',
  WATER_EC: 'mS/cm',
  WATER_PRESSURE: 'bar',
  TANK_LEVEL: '%',
  FLOW_RATE: 'L/min',
} as const;

export const SENSOR_RANGES = {
  SOIL_MOISTURE: { min: 0, max: 100 },
  SOIL_TEMPERATURE: { min: -10, max: 50 },
  AIR_TEMPERATURE: { min: -10, max: 50 },
  AIR_HUMIDITY: { min: 0, max: 100 },
  WATER_PH: { min: 0, max: 14 },
  WATER_EC: { min: 0, max: 5 },
  WATER_PRESSURE: { min: 0, max: 10 },
  TANK_LEVEL: { min: 0, max: 100 },
  FLOW_RATE: { min: 0, max: 100 },
} as const;

// Default MQTT Configuration
export const DEFAULT_MQTT_CONFIG = {
  host: 'localhost',
  port: 1883,
  clientId: 'irrigation_control_system',
  keepalive: 60,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 30000,
} as const;

// System Limits
export const SYSTEM_LIMITS = {
  MAX_IRRIGATION_DURATION: 240, // minutos
  MAX_FERTIGATION_DURATION: 60, // minutos
  MIN_PH: 5.5,
  MAX_PH: 7.5,
  MIN_EC: 0.5,
  MAX_EC: 3.0,
  MAX_ZONES: 8,
  MAX_RECIPES: 20,
  MAX_SCHEDULES: 50,
} as const;

// Update Intervals (milliseconds)
export const UPDATE_INTERVALS = {
  SENSOR_DATA: 5000, // 5 segundos
  SYSTEM_STATUS: 10000, // 10 segundos
  HEARTBEAT: 30000, // 30 segundos
  HISTORY_CLEANUP: 3600000, // 1 hora
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  MAX_DATA_POINTS: 100,
  REFRESH_INTERVAL: 5000,
  COLORS: {
    PRIMARY: '#3b82f6',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    ERROR: '#ef4444',
    INFO: '#6366f1',
  },
} as const;

// Alert Thresholds
export const ALERT_THRESHOLDS = {
  SOIL_MOISTURE: {
    CRITICAL_LOW: 20,
    WARNING_LOW: 30,
    WARNING_HIGH: 80,
    CRITICAL_HIGH: 90,
  },
  WATER_PH: {
    CRITICAL_LOW: 5.0,
    WARNING_LOW: 5.5,
    WARNING_HIGH: 7.5,
    CRITICAL_HIGH: 8.0,
  },
  WATER_EC: {
    CRITICAL_LOW: 0.3,
    WARNING_LOW: 0.5,
    WARNING_HIGH: 2.5,
    CRITICAL_HIGH: 3.5,
  },
  TANK_LEVEL: {
    CRITICAL_LOW: 10,
    WARNING_LOW: 20,
    WARNING_HIGH: 95,
    CRITICAL_HIGH: 100,
  },
} as const;