import { createRun, getRun } from '@letsrunit/model';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getCloudTasksClient } from '../google-cloud';
import { queueRun } from '../run';

vi.mock('../google-cloud');
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

    vi.mocked(getCloudTasksClient).mockReturnValue({
      createTask: mockCreateTask,
      queuePath: mockQueuePath,
    } as any);

    await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(mockCreateTask).toHaveBeenCalledWith({
      parent: 'projects/test-project/locations/test-region/queues/test-queue',
      task: expect.objectContaining({
        httpRequest: expect.objectContaining({
          url: 'https://worker-url/tasks/run',
          body: Buffer.from(JSON.stringify(mockRun)),
          oidcToken: expect.objectContaining({
            serviceAccountEmail: 'test-project@appspot.gserviceaccount.com',
          }),
        }),
      }),
    });
  });

  it('should use GCP_TASKS_INVOKER_SA_EMAIL if provided', async () => {
    process.env.GCP_PROJECT_ID = 'test-project';
    process.env.GCP_WORKER_URL = 'https://worker-url';
    process.env.GCP_TASKS_INVOKER_SA_EMAIL = 'invoker@test.iam.gserviceaccount.com';

    const mockCreateTask = vi.fn().mockResolvedValue([{}]);
    vi.mocked(getRun).mockResolvedValue({ id: 'test' } as any);
    vi.mocked(getCloudTasksClient).mockReturnValue({
      createTask: mockCreateTask,
      queuePath: vi.fn(),
    } as any);

    await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(mockCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({
        task: expect.objectContaining({
          httpRequest: expect.objectContaining({
            oidcToken: expect.objectContaining({
              serviceAccountEmail: 'invoker@test.iam.gserviceaccount.com',
            }),
          }),
        }),
      })
    );
  });

  it('should not add to queue if not configured', async () => {
    delete process.env.GCP_WORKER_URL;

    const mockId = 'test-id' as any;
    vi.mocked(createRun).mockResolvedValue(mockId);

    await queueRun({ type: 'test', target: 'http://localhost' } as any, {});

    expect(getCloudTasksClient).not.toHaveBeenCalled();
  });
});
