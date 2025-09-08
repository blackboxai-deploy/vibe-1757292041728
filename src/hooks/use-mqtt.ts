"use client";

import { useState, useEffect, useCallback } from 'react';
import { MQTTConnectionStatus, MQTTMessage, MQTTConfig } from '@/types/mqtt';

// Simulação do cliente MQTT para o lado cliente
// Em produção, a comunicação MQTT seria feita via API routes do servidor
export function useMQTT() {
  const [status, setStatus] = useState<MQTTConnectionStatus>({
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
  });

  const [messages, setMessages] = useState<MQTTMessage[]>([]);
  const [config, setConfig] = useState<MQTTConfig>({
    host: 'localhost',
    port: 1883,
    clientId: 'irrigation_system_web',
  });

  // Simular conexão MQTT
  const connect = useCallback(async (newConfig?: Partial<MQTTConfig>) => {
    if (newConfig) {
      setConfig(prev => ({ ...prev, ...newConfig }));
    }

    setStatus(prev => ({ ...prev, connecting: true }));

    try {
      // Simular chamada para API que conecta ao MQTT
      const response = await fetch('/api/mqtt/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        setStatus({
          connected: true,
          connecting: false,
          lastConnected: new Date(),
          reconnectAttempts: 0,
        });
        return true;
      } else {
        throw new Error('Failed to connect to MQTT broker');
      }
    } catch (error) {
      setStatus({
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        reconnectAttempts: status.reconnectAttempts + 1,
      });
      return false;
    }
  }, [config, status.reconnectAttempts]);

  // Simular desconexão
  const disconnect = useCallback(async () => {
    try {
      await fetch('/api/mqtt/disconnect', { method: 'POST' });
      setStatus({
        connected: false,
        connecting: false,
        reconnectAttempts: 0,
      });
    } catch (error) {
      console.error('Error disconnecting:', error);
    }
  }, []);

  // Publicar mensagem
  const publish = useCallback(async (topic: string, payload: string | object, options?: { qos?: 0 | 1 | 2; retain?: boolean }) => {
    try {
      const response = await fetch('/api/mqtt/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
          ...options,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error publishing message:', error);
      return false;
    }
  }, []);

  // Simular inscrição em tópico
  const subscribe = useCallback(async (topic: string, qos: 0 | 1 | 2 = 0) => {
    try {
      const response = await fetch('/api/mqtt/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, qos }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }, []);

  // Simular desinscrição
  const unsubscribe = useCallback(async (topic: string) => {
    try {
      const response = await fetch('/api/mqtt/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }, []);

  // Simular tentativa de reconexão automática
  useEffect(() => {
    let reconnectTimer: number;

    if (!status.connected && !status.connecting && status.reconnectAttempts < 5) {
      reconnectTimer = setTimeout(() => {
        connect();
      }, Math.min(1000 * Math.pow(2, status.reconnectAttempts), 30000)); // Exponential backoff
    }

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [status.connected, status.connecting, status.reconnectAttempts, connect]);

  // Simular polling de mensagens (em produção seria WebSocket ou Server-Sent Events)
  useEffect(() => {
    if (!status.connected) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/mqtt/messages');
        if (response.ok) {
          const newMessages: MQTTMessage[] = await response.json();
          setMessages(prev => [...newMessages, ...prev].slice(0, 100)); // Manter apenas as 100 últimas
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status.connected]);

  return {
    status,
    messages,
    config,
    connect,
    disconnect,
    publish,
    subscribe,
    unsubscribe,
    setConfig,
  };
}