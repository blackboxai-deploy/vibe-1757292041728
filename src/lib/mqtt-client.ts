import mqtt, { MqttClient } from 'mqtt';
import { MQTTConfig, MQTTMessage, MQTTConnectionStatus, MQTTTopicSubscription } from '@/types/mqtt';
import { DEFAULT_MQTT_CONFIG } from '@/lib/utils/constants';

class MQTTClientManager {
  private client: MqttClient | null = null;
  private config: MQTTConfig = DEFAULT_MQTT_CONFIG;
  private status: MQTTConnectionStatus = {
    connected: false,
    connecting: false,
    reconnectAttempts: 0,
  };
  private subscriptions = new Map<string, MQTTTopicSubscription>();
  private messageQueue: MQTTMessage[] = [];
  private eventListeners = new Map<string, ((data: any) => void)[]>();

  constructor() {
    // Inicialização do cliente
  }

  // Configurar conexão MQTT
  configure(config: Partial<MQTTConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Conectar ao broker MQTT
  async connect(): Promise<boolean> {
    if (this.client && this.status.connected) {
      return true;
    }

    try {
      this.status.connecting = true;
      this.emitStatusUpdate();

      const options = {
        clientId: this.config.clientId,
        username: this.config.username,
        password: this.config.password,
        keepalive: this.config.keepalive || 60,
        clean: this.config.clean !== false,
        reconnectPeriod: 5000,
        connectTimeout: 30000,
      };

      const brokerUrl = `mqtt://${this.config.host}:${this.config.port}`;
      this.client = mqtt.connect(brokerUrl, options);

      return new Promise((resolve, reject) => {
        if (!this.client) {
          reject(new Error('Failed to create MQTT client'));
          return;
        }

        this.client.on('connect', () => {
          this.status = {
            connected: true,
            connecting: false,
            lastConnected: new Date(),
            reconnectAttempts: 0,
          };
          this.emitStatusUpdate();
          
          // Reinscrever em todos os tópicos
          this.resubscribeAll();
          
          // Processar mensagens enfileiradas
          this.processMessageQueue();
          
          resolve(true);
        });

        this.client.on('error', (error) => {
          this.status = {
            connected: false,
            connecting: false,
            error: error.message,
            reconnectAttempts: this.status.reconnectAttempts + 1,
          };
          this.emitStatusUpdate();
          reject(error);
        });

        this.client.on('message', (topic, payload) => {
          const message: MQTTMessage = {
            topic,
            payload: payload.toString(),
            timestamp: new Date(),
          };

          this.handleMessage(message);
        });

        this.client.on('close', () => {
          this.status.connected = false;
          this.emitStatusUpdate();
        });

        this.client.on('offline', () => {
          this.status.connected = false;
          this.emitStatusUpdate();
        });

        this.client.on('reconnect', () => {
          this.status.connecting = true;
          this.status.reconnectAttempts++;
          this.emitStatusUpdate();
        });
      });
    } catch (error) {
      this.status = {
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reconnectAttempts: this.status.reconnectAttempts + 1,
      };
      this.emitStatusUpdate();
      return false;
    }
  }

  // Desconectar do broker
  async disconnect(): Promise<void> {
    if (this.client && this.status.connected) {
      return new Promise((resolve) => {
        this.client!.end(false, {}, () => {
          this.client = null;
          this.status = {
            connected: false,
            connecting: false,
            reconnectAttempts: 0,
          };
          this.emitStatusUpdate();
          resolve();
        });
      });
    }
  }

  // Publicar mensagem
  async publish(topic: string, payload: string | object, options?: { qos?: 0 | 1 | 2; retain?: boolean }): Promise<boolean> {
    const message: MQTTMessage = {
      topic,
      payload: typeof payload === 'string' ? payload : JSON.stringify(payload),
      qos: options?.qos || 0,
      retain: options?.retain || false,
      timestamp: new Date(),
    };

    if (!this.client || !this.status.connected) {
      // Enfileirar mensagem se não conectado
      this.messageQueue.push(message);
      return false;
    }

    return new Promise((resolve, reject) => {
      this.client!.publish(
        message.topic,
        message.payload.toString(),
        {
          qos: message.qos || 0,
          retain: message.retain || false,
        },
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve(true);
          }
        }
      );
    });
  }

  // Inscrever-se em tópico
  subscribe(topic: string, qos: 0 | 1 | 2 = 0, callback?: (message: MQTTMessage) => void): boolean {
    const subscription: MQTTTopicSubscription = {
      topic,
      qos,
      callback,
    };

    this.subscriptions.set(topic, subscription);

    if (this.client && this.status.connected) {
      this.client.subscribe(topic, { qos }, (error) => {
        if (error) {
          console.error(`Failed to subscribe to ${topic}:`, error);
        }
      });
    }

    return true;
  }

  // Desinscrever-se de tópico
  unsubscribe(topic: string): boolean {
    this.subscriptions.delete(topic);

    if (this.client && this.status.connected) {
      this.client.unsubscribe(topic, {}, (error) => {
        if (error) {
          console.error(`Failed to unsubscribe from ${topic}:`, error);
        }
      });
    }

    return true;
  }

  // Obter status da conexão
  getStatus(): MQTTConnectionStatus {
    return { ...this.status };
  }

  // Adicionar listener de eventos
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  // Remover listener de eventos
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  // Métodos privados
  private handleMessage(message: MQTTMessage): void {
    const subscription = this.subscriptions.get(message.topic);
    if (subscription && subscription.callback) {
      subscription.callback(message);
    }

    // Emitir evento genérico
    this.emit('message', message);
    
    // Emitir evento específico do tópico
    this.emit(`message:${message.topic}`, message);
  }

  private resubscribeAll(): void {
    for (const [topic, subscription] of this.subscriptions) {
      if (this.client) {
        this.client.subscribe(topic, { qos: subscription.qos });
      }
    }
  }

  private processMessageQueue(): void {
    const queue = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of queue) {
      this.publish(message.topic, message.payload, {
        qos: message.qos,
        retain: message.retain,
      });
    }
  }

  private emitStatusUpdate(): void {
    this.emit('status', this.status);
  }

  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}

// Instância singleton do cliente MQTT
export const mqttClient = new MQTTClientManager();

// Funções de conveniência para usar em hooks e componentes
export const connectToMQTT = (config?: Partial<MQTTConfig>) => {
  if (config) {
    mqttClient.configure(config);
  }
  return mqttClient.connect();
};

export const publishMessage = (topic: string, payload: string | object, options?: { qos?: 0 | 1 | 2; retain?: boolean }) => {
  return mqttClient.publish(topic, payload, options);
};

export const subscribeToTopic = (topic: string, callback?: (message: MQTTMessage) => void, qos: 0 | 1 | 2 = 0) => {
  return mqttClient.subscribe(topic, qos, callback);
};

export const getMQTTStatus = () => {
  return mqttClient.getStatus();
};

export default mqttClient;