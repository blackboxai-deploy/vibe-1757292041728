"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMQTT } from "@/hooks/use-mqtt";
import { cn } from "@/lib/utils";

interface MQTTStatusProps {
  className?: string;
  showDetails?: boolean;
}

export function MQTTStatus({ className, showDetails = false }: MQTTStatusProps) {
  const { status, config, connect, disconnect, setConfig } = useMQTT();
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [configForm, setConfigForm] = useState({
    host: config.host,
    port: config.port.toString(),
    clientId: config.clientId,
    username: config.username || '',
    password: config.password || '',
  });

  const handleConnect = async () => {
    const success = await connect({
      ...config,
      host: configForm.host,
      port: parseInt(configForm.port),
      clientId: configForm.clientId,
      username: configForm.username || undefined,
      password: configForm.password || undefined,
    });
    
    if (success) {
      setIsConfigOpen(false);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const getStatusColor = () => {
    if (status.connected) return "bg-green-500";
    if (status.connecting) return "bg-yellow-500";
    if (status.error) return "bg-red-500";
    return "bg-gray-500";
  };

  const getStatusText = () => {
    if (status.connected) return "Conectado";
    if (status.connecting) return "Conectando...";
    if (status.error) return "Erro";
    return "Desconectado";
  };

  const formatLastConnected = () => {
    if (!status.lastConnected) return "Nunca";
    return status.lastConnected.toLocaleString();
  };

  if (!showDetails) {
    return (
      <div className={cn("flex items-center space-x-2", className)}>
        <div className={cn("w-3 h-3 rounded-full", getStatusColor())} />
        <span className="text-sm font-medium">{getStatusText()}</span>
        {status.error && (
          <Badge variant="destructive" className="text-xs">
            Erro
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Conexão MQTT</CardTitle>
          <div className={cn("w-3 h-3 rounded-full", getStatusColor())} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <Badge variant={status.connected ? "default" : status.error ? "destructive" : "secondary"}>
              {getStatusText()}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Broker:</span>
            <span className="text-sm font-mono">
              {config.host}:{config.port}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Client ID:</span>
            <span className="text-sm font-mono">{config.clientId}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Última conexão:</span>
            <span className="text-sm">{formatLastConnected()}</span>
          </div>
          
          {status.reconnectAttempts > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tentativas:</span>
              <span className="text-sm">{status.reconnectAttempts}</span>
            </div>
          )}
          
          {status.error && (
            <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
              {status.error}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {status.connected ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDisconnect}
              disabled={status.connecting}
            >
              Desconectar
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={() => connect()}
              disabled={status.connecting}
            >
              {status.connecting ? "Conectando..." : "Conectar"}
            </Button>
          )}
          
          <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                Configurar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configuração MQTT</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="host">Host</Label>
                    <Input
                      id="host"
                      value={configForm.host}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, host: e.target.value }))}
                      placeholder="localhost"
                    />
                  </div>
                  <div>
                    <Label htmlFor="port">Porta</Label>
                    <Input
                      id="port"
                      type="number"
                      value={configForm.port}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, port: e.target.value }))}
                      placeholder="1883"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={configForm.clientId}
                    onChange={(e) => setConfigForm(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="irrigation_system_web"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuário (opcional)</Label>
                    <Input
                      id="username"
                      value={configForm.username}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, username: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha (opcional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={configForm.password}
                      onChange={(e) => setConfigForm(prev => ({ ...prev, password: e.target.value }))}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleConnect} disabled={status.connecting}>
                    {status.connecting ? "Conectando..." : "Conectar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}