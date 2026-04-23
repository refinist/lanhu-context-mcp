# 通用

支持通过 CLI 参数和环境变量两种方式配置。

## 配置优先级

运行时优先级是：

1. CLI flags
2. 环境变量
3. env 文件
4. 代码内默认值

当通过 env 文件加载时，选用哪个文件的优先级是：

1. `--env-file`
2. `ENV_FILE`
3. 默认 `.env.local`

## 配置项

| 配置项        | CLI 参数             | 环境变量       | 默认值        | 说明                                                        |
| ------------- | -------------------- | -------------- | ------------- | ----------------------------------------------------------- |
| Lanhu Token   | `--lanhu-token`      | `LANHU_TOKEN`  | 无            | 蓝湖主站 Token。通常写在 `.env.local`；不提供时进程直接退出 |
| DDS Token     | `--dds-token`        | `DDS_TOKEN`    | `LANHU_TOKEN` | DDS 服务 Token，默认复用主 Token                            |
| env 文件路径  | `--env-file`         | `ENV_FILE`     | `.env.local`  | 自定义 env 文件路径，`--env-file` 优先级更高                |
| 请求超时      | `--http-timeout`     | `HTTP_TIMEOUT` | `30000`       | 请求超时，单位毫秒                                          |
| 传输模式      | `--stdio` / `--http` | `STDIO`        | `true`        | 默认使用 stdio；设为 `--http` 或 `STDIO=false` 时切到 HTTP  |
| HTTP host     | `--host`             | `HOST`         | `127.0.0.1`   | HTTP 模式监听地址                                           |
| HTTP port     | `--port`             | `PORT`         | `5200`        | HTTP 模式监听端口                                           |
| Tailwind 输出 | `--tailwindcss`      | `TAILWINDCSS`  | `false`       | 把主输出从 `HTML+CSS` 切到 `HTML+Tailwind`                  |
| 跳过切图      | `--skip-slices`      | `SKIP_SLICES`  | `false`       | 跳过图片本地化映射，保留远程图片 URL                        |
| 单位缩放      | `--unit-scale`       | `UNIT_SCALE`   | `1`           | 按倍率放大 CSS 中的 `px` 数值                               |
| 提示语言      | `--prompt-lang`      | `PROMPT_LANG`  | `en-US`       | 工具提示文本语言，可选 `en-US` / `zh-CN`                    |
