export interface ReceiveOptions {
  wait?: boolean;
  timeout?: number;
  after?: number;
}

export interface Email {
  timestamp: number;
  from: string;
  to: string;
  cc?: string;
  subject: string;
  html?: string;
  text: string;
  attachments?: Attachment[];
}

export interface Attachment {
  filename: string;
  contentType: string;
}
