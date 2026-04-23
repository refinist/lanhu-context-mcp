export const TOOL_DESCRIPTION =
  '分析蓝湖设计稿并返回 HTML+CSS 设计规格，同时输出图片下载映射、Design Tokens 及设计图预览。';

export const URL_INPUT_DESCRIPTION =
  '包含 tid、pid（project_id）、image_id 的蓝湖设计稿详情链接。';

export const ERROR_STOP_INSTRUCTION =
  '\n停止：不要尝试继续、猜测或绕过此错误。请将上述错误信息报告给开发者，等待其处理。';

export const HTML_CODE_LABEL = 'HTML+CSS 代码：\n';
export const HTML_CODE_LABEL_TAILWIND =
  'HTML+Tailwind 代码（所有 Tailwind 类都可直接用于生产，请严格按原样使用）：\n';

export function imageMappingText(count: number, curlLines: string): string {
  return (
    `图片资源下载映射（共 ${count} 个）：\n` +
    `路径结构示例为 ./src/assets/{设计稿名称}/{icon-序号}.{ext}。\n` +
    `这里的 {设计稿名称}、{icon-序号} 仅为默认占位符，实际落地时必须根据真实页面名称替换{设计稿名称}，icon 名称不能是 icon-1，icon-2，必须语义化。命名格式默认建议使用小写连接符（kebab-case）。如目标仓库另有规定，则以仓库规范为准，并同步更新所有引用。\n` +
    `${curlLines}\n` +
    `Windows 环境请将上述 curl 命令转换为 Invoke-WebRequest。\n` +
    `如果目标文件夹已存在，请在文件夹名后加数字序号以避免覆盖（如 foo-bar-2）。`
  );
}

export const DESIGN_TOKENS_HEADER = 'Design Tokens（补充参考）';

export function guideText(
  projectName: string | undefined,
  designName: string
): string {
  const headerLines: string[] = [];
  if (projectName) headerLines.push(`项目：${projectName}`);
  headerLines.push(`设计稿：${designName}`);
  return (
    `${headerLines.join('\n')}\n` +
    `超关键：生成的代码必须进行相应调整，以符合目标项目的技术栈和样式系统。\n` +
    `1. 分析目标代码库，以确定：技术栈、样式方案、组件模式以及 Design Tokens。\n` +
    `2. 将 HTML+CSS 语法转换为目标框架/库的形式。\n` +
    `3. 将所有样式转换为目标样式系统，同时保持精确的视觉设计效果。\n` +
    `4. 遵循该项目现有的模式和规范。\n` +
    `5. 提供的代码是 Web 原生实现，使用基于 px 的数值以确保像素级精准还原。\n` +
    `   - Web 项目：所有样式值必须原样使用，禁止简化、合并或重写任何 CSS 属性值。如上方提供的是 Tailwind，直接使用 Tailwind 类，不要转成自定义 class、inline style 或其他形式；禁止将任意值 px 类转换为命名工具类（如 ml-[16px] 必须保留，不得改为 ml-4）。\n` +
    `   - 非 Web 项目（Android、iOS、Flutter 等）：将 px 值作为设计规格，转换为平台原生单位/API（dp、pt、SwiftUI 修饰符等）。\n` +
    `6. 优先级：HTML+CSS > Design Tokens > 设计图预览。\n` +
    `7. 如上方包含图片下载映射，在编写代码前，请确保下载所有图片。\n` +
    `8. 如上方包含 Design Tokens，仅当 HTML+CSS 明显缺失某个属性时，才将其作为补充参考。\n` +
    `9. 完成代码后必须执行视觉自检：将生成的代码与上方提供的设计图预览、设计规格进行对照，在心中核对整体布局、主要元素、关键视觉（颜色/间距/字号）。除非用户明确要求，否则禁止启动浏览器、运行 dev/preview server 或进行截图对比。仅当存在明显差异时（如布局错位、元素缺失、视觉明显偏离）才基于专业经验进行微调；若无明显差异，严禁自行调整，保持原样。最后在回复末尾用一句话说明自检结论，格式为「视觉自检：无明显偏差」或「视觉自检：已调整 —— <列出具体项>」。`
  );
}

export const ERROR_HTML_GENERATION = (msg: string): string =>
  `生成 HTML 失败：${msg}`;

export const ERROR_IMAGE_DOWNLOAD = (msg: string): string =>
  `设计图预览下载失败：${msg}`;

export const ERROR_DESIGN_TOKENS = (msg: string): string =>
  `Design Tokens 提取失败：${msg}`;
