import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DEFAULT_ENV_FILE, getServerConfig } from '../config.ts';

describe('getServerConfig transport mode', () => {
  const originalArgv = [...process.argv];
  const originalCwd = process.cwd();
  const originalEnv = {
    LANHU_TOKEN: process.env.LANHU_TOKEN,
    DDS_TOKEN: process.env.DDS_TOKEN,
    HTTP_TIMEOUT: process.env.HTTP_TIMEOUT,
    STDIO: process.env.STDIO,
    TAILWINDCSS: process.env.TAILWINDCSS,
    SKIP_SLICES: process.env.SKIP_SLICES,
    UNIT_SCALE: process.env.UNIT_SCALE,
    PROMPT_LANG: process.env.PROMPT_LANG,
    PORT: process.env.PORT,
    HOST: process.env.HOST,
    ENV_FILE: process.env.ENV_FILE
  };
  let tempDir: string;
  let envFile: string;

  function setEnvValue(
    key: keyof typeof originalEnv,
    value: string | undefined
  ) {
    if (value == null) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  function loadConfig(
    args: string[] = [],
    options: { withEnvFileFlag?: boolean } = {}
  ): ReturnType<typeof getServerConfig> {
    process.argv = ['node', 'dist/run.mjs'];
    if (options.withEnvFileFlag !== false) {
      process.argv.push('--env-file', envFile);
    }
    process.argv.push(...args);
    return getServerConfig();
  }

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'lanhu-context-config-'));
    envFile = join(tempDir, DEFAULT_ENV_FILE);
    writeFileSync(envFile, '');
    setEnvValue('LANHU_TOKEN', 'test-token');
    setEnvValue('DDS_TOKEN', undefined);
    setEnvValue('HTTP_TIMEOUT', undefined);
    setEnvValue('STDIO', undefined);
    setEnvValue('TAILWINDCSS', undefined);
    setEnvValue('SKIP_SLICES', undefined);
    setEnvValue('UNIT_SCALE', undefined);
    setEnvValue('PROMPT_LANG', undefined);
    setEnvValue('PORT', undefined);
    setEnvValue('HOST', undefined);
    setEnvValue('ENV_FILE', undefined);
  });

  afterEach(() => {
    process.argv = [...originalArgv];
    process.chdir(originalCwd);
    for (const [key, value] of Object.entries(originalEnv)) {
      setEnvValue(key as keyof typeof originalEnv, value);
    }
    rmSync(tempDir, { recursive: true, force: true });
  });

  test('defaults to stdio mode when no transport flag is provided', () => {
    const config = loadConfig();
    expect(config.isStdioMode).toBe(true);
    expect(config.isHttpMode).toBe(false);
  });

  test('uses HTTP mode when STDIO=false', () => {
    setEnvValue('STDIO', 'false');
    const config = loadConfig();
    expect(config.isStdioMode).toBe(false);
    expect(config.isHttpMode).toBe(true);
  });

  test('uses HTTP mode when --http is provided', () => {
    const config = loadConfig(['--http']);
    expect(config.isStdioMode).toBe(false);
    expect(config.isHttpMode).toBe(true);
  });

  test('lets --stdio override STDIO=false', () => {
    setEnvValue('STDIO', 'false');
    const config = loadConfig(['--stdio']);
    expect(config.isStdioMode).toBe(true);
    expect(config.isHttpMode).toBe(false);
  });

  test('reads optional settings from env', () => {
    setEnvValue('LANHU_TOKEN', undefined);
    writeFileSync(
      envFile,
      [
        'LANHU_TOKEN=file-token',
        'DDS_TOKEN=file-dds-token',
        'HTTP_TIMEOUT=45000',
        'STDIO=1',
        'TAILWINDCSS=1',
        'SKIP_SLICES=1',
        'UNIT_SCALE=2',
        'PROMPT_LANG=zh-CN',
        'PORT=4567',
        'HOST=0.0.0.0'
      ].join('\n')
    );

    const config = loadConfig();

    expect(config).toMatchObject({
      lanhuToken: 'file-token',
      ddsToken: 'file-dds-token',
      httpTimeout: 45000,
      isStdioMode: true,
      isHttpMode: false,
      tailwindcss: true,
      skipSlices: true,
      unitScale: 2,
      promptLang: 'zh-CN',
      port: 4567,
      host: '0.0.0.0'
    });
  });

  test('uses ENV_FILE when --env-file is not provided', () => {
    const altEnvFile = join(tempDir, '.env.custom');
    writeFileSync(altEnvFile, 'LANHU_TOKEN=env-file-token');
    setEnvValue('LANHU_TOKEN', undefined);
    setEnvValue('ENV_FILE', altEnvFile);

    const config = loadConfig([], { withEnvFileFlag: false });

    expect(config.lanhuToken).toBe('env-file-token');
  });

  test('loads the default relative .env.local file from the current working directory', () => {
    setEnvValue('LANHU_TOKEN', undefined);
    writeFileSync(envFile, 'LANHU_TOKEN=default-env-token');
    process.chdir(tempDir);

    const config = loadConfig([], { withEnvFileFlag: false });

    expect(config.lanhuToken).toBe('default-env-token');
  });

  test('falls back for unsupported env values and reuses LANHU token for DDS', () => {
    setEnvValue('LANHU_TOKEN', undefined);
    writeFileSync(
      envFile,
      ['LANHU_TOKEN=file-token', 'STDIO=0', 'PROMPT_LANG=fr-FR', 'PORT=0'].join(
        '\n'
      )
    );

    const config = loadConfig();

    expect(config.ddsToken).toBe('file-token');
    expect(config.isStdioMode).toBe(false);
    expect(config.isHttpMode).toBe(true);
    expect(config.promptLang).toBe('en-US');
    expect(config.port).toBe(0);
  });

  test('prints an error and exits when LANHU_TOKEN is missing', () => {
    setEnvValue('LANHU_TOKEN', undefined);
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const processExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('EXIT');
    }) as never);

    expect(() => loadConfig()).toThrow('EXIT');
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('LANHU_TOKEN is required')
    );
    expect(processExit).toHaveBeenCalledWith(1);
  });
});
