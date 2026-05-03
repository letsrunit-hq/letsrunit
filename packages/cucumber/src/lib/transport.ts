import type { StreamEvent } from './stream-events';

export interface StreamTransport {
  send(events: StreamEvent[]): Promise<void>;
  flush(): Promise<void>;
  close(): Promise<void>;
}

export class NoopTransport implements StreamTransport {
  async send(_events: StreamEvent[]): Promise<void> {}
  async flush(): Promise<void> {}
  async close(): Promise<void> {}
}

export type HttpTransportOptions = {
  endpoint: string;
  token?: string;
  headers?: Record<string, string>;
  batchSize?: number;
};

export class HttpTransport implements StreamTransport {
  private readonly endpoint: string;
  private readonly token?: string;
  private readonly headers: Record<string, string>;
  private readonly batchSize: number;
  private readonly queue: StreamEvent[] = [];

  constructor(options: HttpTransportOptions) {
    this.endpoint = options.endpoint;
    this.token = options.token;
    this.headers = options.headers ?? {};
    this.batchSize = Math.max(1, options.batchSize ?? 20);
  }

  async send(events: StreamEvent[]): Promise<void> {
    this.queue.push(...events);
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = this.queue.splice(0, this.queue.length);

    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.token ? { authorization: `Bearer ${this.token}` } : {}),
        ...this.headers,
      },
      body: JSON.stringify({ events }),
    });

    if (!response.ok) {
      throw new Error(`Stream transport failed with status ${response.status}`);
    }
  }

  async close(): Promise<void> {
    await this.flush();
  }
}
