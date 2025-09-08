"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Dados simulados para demonstração
const mockSensorData = [
  {
    id: "soil-1",
    name: "Umidade do Solo - Zona 1",
    value: 65,
    unit: "%",
    status: "normal",
    lastUpdate: new Date(),
  },
  {
    id: "temp-1",
    name: "Temperatura Ambiente",
    value: 24.5,
    unit: "°C",
    status: "normal",
    lastUpdate: new Date(),
  },
  {
    id: "ph-1",
    name: "pH da Água",
    value: 6.8,
    unit: "pH",
    status: "normal",
    lastUpdate: new Date(),
  },
  {
    id: "tank-1",
    name: "Nível do Reservatório",
    value: 85,
    unit: "%",
    status: "normal",
    lastUpdate: new Date(),
  },
];

const mockSystemStatus = {
  mqtt: { connected: false, lastUpdate: new Date() },
  irrigation: { active: false, zonesActive: 0 },
  fertigation: { active: false, recipesRunning: 0 },
};

export default function Dashboard() {
  const [sensorData, setSensorData] = useState(mockSensorData);
  const [systemStatus, setSystemStatus] = useState(mockSystemStatus);

  useEffect(() => {
    // Simular atualizações dos sensores
    const interval = setInterval(() => {
      setSensorData(prev => prev.map(sensor => ({
        ...sensor,
        value: sensor.value + (Math.random() - 0.5) * 2,
        lastUpdate: new Date(),
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "normal": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "error": return "bg-red-500";
      default: return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "normal": return "Normal";
      case "warning": return "Atenção";
      case "error": return "Erro";
      default: return "Offline";
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r">
        <div className="p-6">
          <h1 className="text-xl font-bold text-gray-900">
            Sistema de Irrigação
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Controle e Monitoramento
          </p>
        </div>
        
        <nav className="px-4 space-y-2">
          <Button variant="default" className="w-full justify-start">
            Dashboard
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Irrigação
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Fertirrigação
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Sensores
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Histórico
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            Configurações
          </Button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600 mt-2">
              Visão geral do sistema de irrigação e monitoramento
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Conexão MQTT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${systemStatus.mqtt.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-lg font-semibold">
                    {systemStatus.mqtt.connected ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Última atualização: {systemStatus.mqtt.lastUpdate.toLocaleTimeString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sistema de Irrigação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={systemStatus.irrigation.active ? "default" : "secondary"}>
                    {systemStatus.irrigation.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-lg font-semibold">
                    {systemStatus.irrigation.zonesActive} zonas
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Zonas atualmente irrigando
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Sistema de Fertirrigação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant={systemStatus.fertigation.active ? "default" : "secondary"}>
                    {systemStatus.fertigation.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <span className="text-lg font-semibold">
                    {systemStatus.fertigation.recipesRunning} receitas
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Receitas em execução
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Sensors Grid */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Sensores em Tempo Real</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {sensorData.map((sensor) => (
                <Card key={sensor.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">{sensor.name}</CardTitle>
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(sensor.status)}`}></div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-2xl font-bold text-gray-900">
                          {sensor.value.toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-500">{sensor.unit}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {getStatusText(sensor.status)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {sensor.lastUpdate.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">💧</span>
                <span>Iniciar Irrigação</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">🌱</span>
                <span>Iniciar Fertirrigação</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">📊</span>
                <span>Ver Relatórios</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <span className="text-lg">⚙️</span>
                <span>Configurações</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}