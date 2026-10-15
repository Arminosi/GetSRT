# 拾句 · SRT 字幕提取

基于 TypeScript、React 和 Vite 的轻量字幕提取工具，无后端。文件仅在浏览器本地处理。

## 本地运行

需要 Node.js 22.18+ 或 24+。

```sh
npm install
npm run dev
```

打开终端显示的本地地址。

## 使用

- 上传或拖入 `.srt` / `.txt` 字幕文件，也可以直接粘贴 SRT 内容。
- 自动去掉序号、时间轴和常见样式标签；每条字幕中的多行文字合并为一行。
- 可选去除重复字幕，支持一键复制与下载 UTF-8 TXT。
- 支持 UTF-8、带 BOM 的 UTF-16，以及 GB18030 / GBK 字幕文件；最大 10 MB。
- 点击「试试示例」即可体验。

## 验证与构建

```sh
npm test
npm run build
npm run preview
```

构建结果位于 `dist/`，可部署到静态网站托管服务。
