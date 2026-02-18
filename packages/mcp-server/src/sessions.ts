import { Controller, type ControllerOptions } from '@letsrunit/controller';
import { Journal } from '@letsrunit/journal';
import { join } from 'node:path';
import { McpSink } from './sink.js';

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface Session {
  id: string;
  controller: Controller;
  sink: McpSink;
  journal: Journal<McpSink>;
  artifactDir: string;
  createdAt: number;
  lastActivity: number;
  stepCount: number;
}

const BASE_ARTIFACT_DIR = process.env.LETSRUNIT_ARTIFACT_DIR ?? join(process.env.HOME ?? '/tmp', '.letsrunit', 'artifacts');

function sessionId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

class SessionManager {
  private readonly sessions = new Map<string, Session>();
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();

  async create(options: ControllerOptions = {}): Promise<Session> {
    const id = sessionId();
    const artifactDir = join(BASE_ARTIFACT_DIR, id);

    const sink = new McpSink(artifactDir);
    const journal = new Journal(sink);

    const controller = await Controller.launch({ ...options, journal });

    const session: Session = {
      id,
      controller,
      sink,
      journal,
      artifactDir,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      stepCount: 0,
    };

    this.sessions.set(id, session);
    this.resetTimer(id);

    return session;
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  touch(id: string): void {
    const session = this.sessions.get(id);
    if (session) {
      session.lastActivity = Date.now();
      this.resetTimer(id);
    }
  }

  list(): Session[] {
    return Array.from(this.sessions.values());
  }

  async close(id: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) return;

    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
    this.sessions.delete(id);

    await session.controller.close();
  }

  private resetTimer(id: string): void {
    clearTimeout(this.timers.get(id));
    const timer = setTimeout(() => this.close(id), SESSION_TIMEOUT_MS);
    // Allow Node.js to exit even if a timer is pending
    if (typeof timer === 'object' && 'unref' in timer) timer.unref();
    this.timers.set(id, timer);
  }
}

export const sessions = new SessionManager();
