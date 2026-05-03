import type { StreamEvent } from './stream-events';

export interface StreamTransport {
  send(events: StreamEvent[]): Promise<void>;
  close(): Promise<void>;
}

export type WebSocketTransportOptions = {
  endpoint: string;
  token?: string;
  headers?: Record<string, string>;
};

export class WebSocketTransport implements StreamTransport {
  private readonly endpoint: string;
  private readonly token?: string;
  private readonly headers: Record<string, string>;
  private socketPromise: Promise<WebSocket> | null = null;

  constructor(options: WebSocketTransportOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token;
    this.headers = options.headers ?? {};
  }

  async send(events: StreamEvent[]): Promise<void> {
    const socket = await this.ensureSocket();
    socket.send(JSON.stringify({ events }));
  }

  async close(): Promise<void> {
    if (!this.socketPromise) return;

    const socket = await this.socketPromise;
    if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) {
      socket.close();
    }
    this.socketPromise = null;
  }

  private async ensureSocket(): Promise<WebSocket> {
    if (!this.socketPromise) {
      this.socketPromise = this.openSocket();
    }
    return this.socketPromise;
  }

  private openSocket(): Promise<WebSocket> {
    const WsCtor = globalThis.WebSocket;
    if (!WsCtor) {
      throw new Error('WebSocket is not available in this runtime');
    }

    return new Promise<WebSocket>((resolve, reject) => {
      const protocols: string[] = [];
      if (this.token) protocols.push(`bearer.${this.token}`);

      const socket = new WsCtor(this.endpoint, protocols.length ? protocols : undefined);

      socket.addEventListener('open', () => {
        if (Object.keys(this.headers).length > 0) {
          socket.send(JSON.stringify({ type: 'stream_headers', headers: this.headers }));
        }
        resolve(socket);
      });

      socket.addEventListener('error', () => {
        reject(new Error('Failed to open WebSocket stream transport'));
      });

      socket.addEventListener('close', () => {
        this.socketPromise = null;
      });
    });
  }
}
