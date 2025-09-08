import Database from 'better-sqlite3';
import { SensorReading, SensorAlert } from '@/types/sensors';

class DatabaseManager {
  private db: Database.Database | null = null;
  private dbPath: string = './irrigation_system.db';

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.db = new Database(this.dbPath);
      this.db.pragma('journal_mode = WAL');
      this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private createTables() {
    if (!this.db) return;

    // Tabela de leituras de sensores
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_readings (
        id TEXT PRIMARY KEY,
        sensor_id TEXT NOT NULL,
        value REAL NOT NULL,
        unit TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        quality TEXT DEFAULT 'good',
        FOREIGN KEY (sensor_id) REFERENCES sensors(id)
      )
    `);

    // Tabela de sensores
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sensors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        location TEXT,
        zone TEXT,
        status TEXT DEFAULT 'offline',
        min_value REAL DEFAULT 0,
        max_value REAL DEFAULT 100,
        warning_min REAL DEFAULT 20,
        warning_max REAL DEFAULT 80,
        critical_min REAL DEFAULT 10,
        critical_max REAL DEFAULT 90,
        unit TEXT NOT NULL,
        mqtt_topic TEXT NOT NULL,
        calibration_offset REAL DEFAULT 0,
        enabled BOOLEAN DEFAULT 1,
        last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de alertas
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sensor_alerts (
        id TEXT PRIMARY KEY,
        sensor_id TEXT NOT NULL,
        type TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        acknowledged BOOLEAN DEFAULT 0,
        value REAL,
        FOREIGN KEY (sensor_id) REFERENCES sensors(id)
      )
    `);

    // Tabela de sessões de irrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS irrigation_sessions (
        id TEXT PRIMARY KEY,
        zone_id TEXT NOT NULL,
        schedule_id TEXT,
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        duration INTEGER DEFAULT 0,
        water_used REAL DEFAULT 0,
        mode TEXT DEFAULT 'manual',
        triggered_by TEXT DEFAULT 'manual',
        status TEXT DEFAULT 'active',
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de zonas de irrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS irrigation_zones (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        area REAL DEFAULT 0,
        crop_type TEXT,
        soil_type TEXT,
        valve_id TEXT NOT NULL,
        enabled BOOLEAN DEFAULT 1,
        water_requirement REAL DEFAULT 0,
        last_irrigation DATETIME,
        total_water_used REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de válvulas de irrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS irrigation_valves (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        status TEXT DEFAULT 'closed',
        flow_rate REAL DEFAULT 0,
        max_pressure REAL DEFAULT 0,
        mqtt_topic TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        last_operated DATETIME,
        enabled BOOLEAN DEFAULT 1,
        maintenance_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (zone_id) REFERENCES irrigation_zones(id)
      )
    `);

    // Tabela de agendamentos de irrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS irrigation_schedules (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        zone_ids TEXT NOT NULL, -- JSON array
        start_time TEXT NOT NULL,
        duration INTEGER NOT NULL,
        days_of_week TEXT NOT NULL, -- JSON array
        enabled BOOLEAN DEFAULT 1,
        mode TEXT DEFAULT 'scheduled',
        conditions TEXT, -- JSON
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_run DATETIME
      )
    `);

    // Tabela de sessões de fertirrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fertigation_sessions (
        id TEXT PRIMARY KEY,
        recipe_id TEXT NOT NULL,
        zone_ids TEXT NOT NULL, -- JSON array
        start_time DATETIME NOT NULL,
        end_time DATETIME,
        status TEXT DEFAULT 'active',
        target_ph REAL DEFAULT 6.5,
        target_ec REAL DEFAULT 1.5,
        actual_ph REAL,
        actual_ec REAL,
        water_used REAL DEFAULT 0,
        nutrients_used TEXT, -- JSON
        mixing_time INTEGER DEFAULT 0,
        injection_time INTEGER DEFAULT 0,
        cost REAL DEFAULT 0,
        notes TEXT,
        triggered_by TEXT DEFAULT 'manual',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de receitas de fertirrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fertigation_recipes (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        crop_type TEXT,
        growth_stage TEXT,
        nutrients TEXT NOT NULL, -- JSON array
        target_ph REAL DEFAULT 6.5,
        target_ec REAL DEFAULT 1.5,
        water_volume REAL DEFAULT 100,
        mixing_time INTEGER DEFAULT 10,
        injection_rate REAL DEFAULT 100,
        enabled BOOLEAN DEFAULT 1,
        total_uses INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_used DATETIME
      )
    `);

    // Tabela de nutrientes
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nutrients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        concentration REAL DEFAULT 0,
        unit TEXT NOT NULL,
        stock_level REAL DEFAULT 0,
        min_stock REAL DEFAULT 0,
        max_stock REAL DEFAULT 100,
        cost REAL DEFAULT 0,
        supplier TEXT,
        expiry_date DATE,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tabela de bombas de fertirrigação
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS fertigation_pumps (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        nutrient_id TEXT NOT NULL,
        status TEXT DEFAULT 'off',
        flow_rate REAL DEFAULT 0,
        max_pressure REAL DEFAULT 0,
        current_volume REAL DEFAULT 0,
        total_volume REAL DEFAULT 0,
        mqtt_topic TEXT NOT NULL,
        calibration_factor REAL DEFAULT 1.0,
        last_maintenance DATETIME,
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nutrient_id) REFERENCES nutrients(id)
      )
    `);

    // Tabela de leituras de qualidade da água
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS water_quality_readings (
        id TEXT PRIMARY KEY,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        ph REAL NOT NULL,
        ec REAL NOT NULL,
        temperature REAL NOT NULL,
        tds REAL NOT NULL,
        location TEXT NOT NULL,
        session_id TEXT
      )
    `);

    // Tabela de configurações do sistema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índices para melhor performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor_timestamp 
      ON sensor_readings(sensor_id, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_sensor_alerts_sensor_timestamp 
      ON sensor_alerts(sensor_id, timestamp DESC);
      
      CREATE INDEX IF NOT EXISTS idx_irrigation_sessions_zone_start 
      ON irrigation_sessions(zone_id, start_time DESC);
      
      CREATE INDEX IF NOT EXISTS idx_fertigation_sessions_recipe_start 
      ON fertigation_sessions(recipe_id, start_time DESC);
      
      CREATE INDEX IF NOT EXISTS idx_water_quality_timestamp 
      ON water_quality_readings(timestamp DESC);
    `);

    console.log('Database tables created successfully');
  }

  // Métodos para leituras de sensores
  async saveSensorReading(reading: SensorReading): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO sensor_readings (id, sensor_id, value, unit, timestamp, quality)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        reading.id,
        reading.sensorId,
        reading.value,
        reading.unit,
        reading.timestamp.toISOString(),
        reading.quality
      );
      
      return true;
    } catch (error) {
      console.error('Error saving sensor reading:', error);
      return false;
    }
  }

  async getSensorReadings(sensorId: string, limit: number = 100): Promise<SensorReading[]> {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM sensor_readings 
        WHERE sensor_id = ? 
        ORDER BY timestamp DESC 
        LIMIT ?
      `);
      
      const rows = stmt.all(sensorId, limit) as any[];
      
      return rows.map(row => ({
        id: row.id,
        sensorId: row.sensor_id,
        value: row.value,
        unit: row.unit,
        timestamp: new Date(row.timestamp),
        quality: row.quality,
      }));
    } catch (error) {
      console.error('Error getting sensor readings:', error);
      return [];
    }
  }

  // Métodos para alertas
  async saveAlert(alert: SensorAlert): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        INSERT INTO sensor_alerts (id, sensor_id, type, message, timestamp, acknowledged, value)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        alert.id,
        alert.sensorId,
        alert.type,
        alert.message,
        alert.timestamp.toISOString(),
        alert.acknowledged ? 1 : 0,
        alert.value
      );
      
      return true;
    } catch (error) {
      console.error('Error saving alert:', error);
      return false;
    }
  }

  async getUnacknowledgedAlerts(): Promise<SensorAlert[]> {
    if (!this.db) return [];

    try {
      const stmt = this.db.prepare(`
        SELECT * FROM sensor_alerts 
        WHERE acknowledged = 0 
        ORDER BY timestamp DESC
      `);
      
      const rows = stmt.all() as any[];
      
      return rows.map(row => ({
        id: row.id,
        sensorId: row.sensor_id,
        type: row.type,
        message: row.message,
        timestamp: new Date(row.timestamp),
        acknowledged: row.acknowledged === 1,
        value: row.value,
      }));
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  // Métodos para configuração
  async setConfig(key: string, value: string, description?: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO system_config (key, value, description, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run(key, value, description);
      return true;
    } catch (error) {
      console.error('Error setting config:', error);
      return false;
    }
  }

  async getConfig(key: string): Promise<string | null> {
    if (!this.db) return null;

    try {
      const stmt = this.db.prepare('SELECT value FROM system_config WHERE key = ?');
      const row = stmt.get(key) as { value: string } | undefined;
      return row?.value || null;
    } catch (error) {
      console.error('Error getting config:', error);
      return null;
    }
  }

  // Limpeza de dados antigos
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    if (!this.db) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const stmt = this.db.prepare(`
        DELETE FROM sensor_readings 
        WHERE timestamp < ?
      `);
      
      stmt.run(cutoffDate.toISOString());
      
      console.log(`Cleaned up sensor readings older than ${daysToKeep} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  // Fechar conexão
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Instância singleton do banco de dados
export const database = new DatabaseManager();

export default database;