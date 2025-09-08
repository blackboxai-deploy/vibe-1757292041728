export interface MQTTConfig {
  host: string;
  port: number;
  clientId: string;
  username?: string;
  password?: string;
  keepalive?: number;
  clean?: boolean;
}

export interface MQTTMessage {
  topic: string;
  payload: string | Uint8Array;
  qos?: 0 | 1 | 2;
  retain?: boolean;
  timestamp: Date;
}

export interface MQTTConnectionStatus {
  connected: boolean;
  connecting: boolean;
  error?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

export interface MQTTTopicSubscription {
  topic: string;
  qos: 0 | 1 | 2;
  callback?: (message: MQTTMessage) => void;
}

export interface MQTTPublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
  dup?: boolean;
}