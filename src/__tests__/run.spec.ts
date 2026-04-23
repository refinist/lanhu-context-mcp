import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('run bootstrap', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
  });
  test('continues boot when compile cache setup throws', async () => {
    const startServer = vi.fn().mockResolvedValue(undefined);
    const enableCompileCache = vi.fn(() => {
      throw new Error('compile cache unavailable');
    });
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    vi.doMock('../app.ts', () => ({ startServer }));
    vi.doMock('node:module', () => ({
      default: { enableCompileCache }
    }));

    await import('../run.ts');
    await Promise.resolve();

    expect(enableCompileCache).toHaveBeenCalledTimes(1);
    expect(startServer).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  test('logs and exits when startServer rejects', async () => {
    const error = new Error('startup failed');
    const startServer = vi.fn().mockRejectedValue(error);
    const enableCompileCache = vi.fn();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const processExit = vi
      .spyOn(process, 'exit')
      .mockImplementation((() => undefined) as never);

    vi.doMock('../app.ts', () => ({ startServer }));
    vi.doMock('node:module', () => ({
      default: { enableCompileCache }
    }));

    await import('../run.ts');
    await Promise.resolve();
    await Promise.resolve();

    expect(enableCompileCache).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      '[run] failed to start server:',
      error
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });
});
