export interface LanhuApiConfig {
  lanhuToken: string;
  ddsToken: string;
  httpTimeout: number;
}

export interface ServerConfig extends LanhuApiConfig {
  port: number;
  host: string;
  isHttpMode: boolean;
  isStdioMode: boolean;
  tailwindcss: boolean;
  skipSlices: boolean;
  unitScale: number;
  promptLang: 'en-US' | 'zh-CN';
  mode?: 'inline' | 'files';
  outDir?: string;
}
