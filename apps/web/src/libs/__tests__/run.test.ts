import { CloudTasksClient } from '@google-cloud/tasks';
import { createRun, getRun } from '@letsrunit/model';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { queueRun } from '../run';

vi.mock('@google-cloud/tasks');
vi.mock('@letsrunit/model');

describe('queueRun', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  it('should create a run and return the id', async () => {
    const mockId = 'test-id' as any;
    vi.mocked(createRun).mockResolvedValue(mockId);

    const result = await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(result).toBe(mockId);
    expect(createRun).toHaveBeenCalled();
  });

  it('should add to Google Task queue if configured', async () => {
    process.env.GCP_QUEUE_NAME = 'test-queue';
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.GCP_REGION = 'test-region';
    process.env.GCP_WORKER_URL = 'https://worker-url';

    const mockId = 'test-id' as any;
    const mockRun = { id: mockId, type: 'test' };
    vi.mocked(createRun).mockResolvedValue(mockId);
    vi.mocked(getRun).mockResolvedValue(mockRun as any);

    const mockCreateTask = vi.fn().mockResolvedValue([{}]);
    const mockQueuePath = vi.fn().mockReturnValue('projects/test-project/locations/test-region/queues/test-queue');

    vi.mocked(CloudTasksClient).mockImplementation(function (this: any) {
      this.createTask = mockCreateTask;
      this.queuePath = mockQueuePath;
    } as any);

    await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(mockCreateTask).toHaveBeenCalledWith({
      parent: 'projects/test-project/locations/test-region/queues/test-queue',
      task: expect.objectContaining({
        httpRequest: expect.objectContaining({
          url: 'https://worker-url/tasks/run',
          body: Buffer.from(JSON.stringify(mockRun)).toString('base64'),
        }),
      }),
    });
  });

  it('should not add to queue if not configured', async () => {
    delete process.env.GCP_QUEUE_NAME;

    const mockId = 'test-id' as any;
    vi.mocked(createRun).mockResolvedValue(mockId);

    await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(CloudTasksClient).not.toHaveBeenCalled();
  });

  it('should use WIF credentials if GCP_WIF_PROVIDER_ID is provided', async () => {
    process.env.GCP_QUEUE_NAME = 'test-queue';
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.GCP_REGION = 'test-region';
    process.env.GCP_WORKER_URL = 'https://worker-url';
    process.env.GCP_WIF_PROVIDER_ID = 'test-provider';
    process.env.GCP_SERVICE_ACCOUNT_EMAIL = 'test-sa@test-project.iam.gserviceaccount.com';

    const mockId = 'test-id' as any;
    vi.mocked(createRun).mockResolvedValue(mockId);
    vi.mocked(getRun).mockResolvedValue({ id: mockId } as any);

    const mockCreateTask = vi.fn().mockResolvedValue([{}]);
    const mockQueuePath = vi.fn().mockReturnValue('projects/test-project/locations/test-region/queues/test-queue');

    vi.mocked(CloudTasksClient).mockImplementation(function (this: any) {
      this.createTask = mockCreateTask;
      this.queuePath = mockQueuePath;
    } as any);

    await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(CloudTasksClient).toHaveBeenCalledWith({
      credentials: {
        client_email: 'test-sa@test-project.iam.gserviceaccount.com',
        project_id: 'test-project',
      },
      projectId: 'test-project',
    });
  });
});
