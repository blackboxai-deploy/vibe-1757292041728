"use client";

import { useState, useEffect, useCallback } from 'react';
import { Sensor, SensorReading, SensorAlert } from '@/types/sensors';
import { useMQTT } from './use-mqtt';

// Dados simulados para demonstração
const mockSensors: Sensor[] = [
  {
    id: 'soil-moisture-1',
    name: 'Umidade do Solo - Zona 1',
    type: 'soil_moisture',
    location: 'Zona 1',
    zone: 'zona-1',
    status: 'online',
    minValue: 0,
    maxValue: 100,
    warningMin: 30,
    warningMax: 80,
    criticalMin: 20,
    criticalMax: 90,
    unit: '%',
    mqttTopic: 'sensors/soil/moisture/zone1',
    enabled: true,
    lastUpdate: new Date(),
  },
  {
    id: 'temp-ambient-1',
    name: 'Temperatura Ambiente',
    type: 'air_temperature',
    location: 'Estufa Principal',
    status: 'online',
    minValue: -10,
    maxValue: 50,
    warningMin: 15,
    warningMax: 35,
    criticalMin: 5,
    criticalMax: 40,
    unit: '°C',
    mqttTopic: 'sensors/environment/temperature',
    enabled: true,
    lastUpdate: new Date(),
  },
  {
    id: 'ph-water-1',
    name: 'pH da Água',
    type: 'water_ph',
    location: 'Reservatório Principal',
    status: 'online',
    minValue: 0,
    maxValue: 14,
    warningMin: 5.5,
    warningMax: 7.5,
    criticalMin: 5.0,
    criticalMax: 8.0,
    unit: 'pH',
    mqttTopic: 'sensors/water/ph',
    enabled: true,
    lastUpdate: new Date(),
  },
  {
    id: 'tank-level-1',
    name: 'Nível do Reservatório',
    type: 'tank_level',
    location: 'Reservatório Principal',
    status: 'online',
    minValue: 0,
    maxValue: 100,
    warningMin: 20,
    warningMax: 95,
    criticalMin: 10,
    criticalMax: 100,
    unit: '%',
    mqttTopic: 'sensors/tank/level',
    enabled: true,
    lastUpdate: new Date(),
  },
];

export function useSensors() {
  const [sensors, setSensors] = useState<Sensor[]>(mockSensors);
  const [readings, setReadings] = useState<Map<string, SensorReading[]>>(new Map());
  const [alerts, setAlerts] = useState<SensorAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const { status: mqttStatus, subscribe, messages } = useMQTT();

  // Gerar leitura simulada para um sensor
  const generateMockReading = useCallback((sensor: Sensor): SensorReading => {
    const baseValue = sensor.lastReading?.value || (sensor.minValue + sensor.maxValue) / 2;
    const variation = (sensor.maxValue - sensor.minValue) * 0.1;
    const newValue = Math.max(
      sensor.minValue,
      Math.min(sensor.maxValue, baseValue + (Math.random() - 0.5) * variation)
    );

    return {
      id: `${sensor.id}-${Date.now()}`,
      sensorId: sensor.id,
      value: parseFloat(newValue.toFixed(1)),
      unit: sensor.unit,
      timestamp: new Date(),
      quality: 'good',
    };
  }, []);

  // Verificar se uma leitura gera alerta
  const checkForAlert = useCallback((sensor: Sensor, reading: SensorReading): SensorAlert | null => {
    const { value } = reading;
    
    if (value <= sensor.criticalMin || value >= sensor.criticalMax) {
      return {
        id: `alert-${sensor.id}-${Date.now()}`,
        sensorId: sensor.id,
        type: 'critical',
        message: `${sensor.name}: Valor crítico detectado (${value}${sensor.unit})`,
        timestamp: new Date(),
        acknowledged: false,
        value,
      };
    }
    
    if (value <= sensor.warningMin || value >= sensor.warningMax) {
      return {
        id: `alert-${sensor.id}-${Date.now()}`,
        sensorId: sensor.id,
        type: 'warning',
        message: `${sensor.name}: Valor fora da faixa normal (${value}${sensor.unit})`,
        timestamp: new Date(),
        acknowledged: false,
        value,
      };
    }
    
    return null;
  }, []);

  // Simular leituras de sensores
  useEffect(() => {
    if (!mqttStatus.connected) return;

    const interval = setInterval(() => {
      setSensors(prevSensors => {
        const updatedSensors = prevSensors.map(sensor => {
          if (!sensor.enabled) return sensor;

          const newReading = generateMockReading(sensor);
          
          // Atualizar histórico de leituras
          setReadings(prevReadings => {
            const sensorReadings = prevReadings.get(sensor.id) || [];
            const updatedReadings = [newReading, ...sensorReadings].slice(0, 100); // Manter apenas 100 leituras
            const newMap = new Map(prevReadings);
            newMap.set(sensor.id, updatedReadings);
            return newMap;
          });

          // Verificar alertas
          const alert = checkForAlert(sensor, newReading);
          if (alert) {
            setAlerts(prevAlerts => [alert, ...prevAlerts].slice(0, 50)); // Manter apenas 50 alertas
          }

          return {
            ...sensor,
            lastReading: newReading,
            lastUpdate: new Date(),
            status: 'online' as const,
          };
        });

        return updatedSensors;
      });
    }, 5000); // Atualizar a cada 5 segundos

    return () => clearInterval(interval);
  }, [mqttStatus.connected, generateMockReading, checkForAlert]);

  // Inscrever-se nos tópicos MQTT dos sensores
  useEffect(() => {
    if (mqttStatus.connected) {
      sensors.forEach(sensor => {
        if (sensor.enabled) {
          subscribe(sensor.mqttTopic);
        }
      });
    }
  }, [mqttStatus.connected, sensors, subscribe]);

  // Processar mensagens MQTT recebidas
  useEffect(() => {
    messages.forEach(message => {
      const sensor = sensors.find(s => s.mqttTopic === message.topic);
      if (sensor) {
        try {
          const value = parseFloat(message.payload.toString());
          if (!isNaN(value)) {
            const reading: SensorReading = {
              id: `${sensor.id}-${Date.now()}`,
              sensorId: sensor.id,
              value,
              unit: sensor.unit,
              timestamp: new Date(),
              quality: 'good',
            };

            // Atualizar leitura do sensor
            setSensors(prev => prev.map(s => 
              s.id === sensor.id 
                ? { ...s, lastReading: reading, lastUpdate: new Date(), status: 'online' as const }
                : s
            ));

            // Adicionar ao histórico
            setReadings(prev => {
              const sensorReadings = prev.get(sensor.id) || [];
              const updatedReadings = [reading, ...sensorReadings].slice(0, 100);
              const newMap = new Map(prev);
              newMap.set(sensor.id, updatedReadings);
              return newMap;
            });

            // Verificar alertas
            const alert = checkForAlert(sensor, reading);
            if (alert) {
              setAlerts(prev => [alert, ...prev].slice(0, 50));
            }
          }
        } catch (error) {
          console.error(`Error processing message for sensor ${sensor.id}:`, error);
        }
      }
    });
  }, [messages, sensors, checkForAlert]);

  // Obter leituras de um sensor específico
  const getSensorReadings = useCallback((sensorId: string, limit: number = 20): SensorReading[] => {
    return (readings.get(sensorId) || []).slice(0, limit);
  }, [readings]);

  // Obter alertas não reconhecidos
  const getUnacknowledgedAlerts = useCallback((): SensorAlert[] => {
    return alerts.filter(alert => !alert.acknowledged);
  }, [alerts]);

  // Reconhecer alerta
  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  // Obter sensores por status
  const getSensorsByStatus = useCallback((status?: string) => {
    return status ? sensors.filter(sensor => sensor.status === status) : sensors;
  }, [sensors]);

  // Obter estatísticas dos sensores
  const getSensorStats = useCallback(() => {
    const online = sensors.filter(s => s.status === 'online').length;
    const offline = sensors.filter(s => s.status === 'offline').length;
    const warning = sensors.filter(s => s.status === 'warning').length;
    const error = sensors.filter(s => s.status === 'error').length;
    const total = sensors.length;

    return { online, offline, warning, error, total };
  }, [sensors]);

  return {
    sensors,
    readings,
    alerts,
    loading,
    getSensorReadings,
    getUnacknowledgedAlerts,
    acknowledgeAlert,
    getSensorsByStatus,
    getSensorStats,
  };
}