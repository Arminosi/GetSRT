import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, DragEvent, SVGProps } from 'react';
import { exampleSrt, extractSubtitles } from './lib/srt';

type IconName = 'lines' | 'upload' | 'file' | 'arrow' | 'copy' | 'download' | 'check' | 'shield' | 'close' | 'spark';
function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    lines: <><path d="M5 6h14M5 12h14M5 18h8" /></>,
    upload: <><path d="M12 16V4m-4 4 4-4 4 4M4 16v4h16v-4" /></>,
    file: <><path d="M14 3H6v18h12V7zM14 3v5h5M9 12h6m-6 4h6" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V4H4v12h4" /></>,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    shield: <><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" /><path d="m8 12 3 3 5-6" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z" /></>,
  };
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}

export default function App() {
  const [source, setSource] = useState('');
  const [fileName, setFileName] = useState('');
  const [deduplicate, setDeduplicate] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const inputVersion = useRef(0);
  const optionId = useId();
  const subtitles = useMemo(() => extractSubtitles(source, deduplicate), [source, deduplicate]);
  const output = subtitles.join('\n');
  const characterCount = Array.from(output.replace(/\n/g, '')).length;

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2800);
    return () => window.clearTimeout(timer);
  }, [notice]);
  useEffect(() => { setCopied(false); }, [output]);

  async function readFile(file?: File) {
    if (!file) return;
    if (!/\.(srt|txt)$/i.test(file.name)) { setError('请选择 .srt 或 .txt 格式的字幕文件。'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('文件过大，请选择 10 MB 以内的字幕文件。'); return; }
    const version = ++inputVersion.current;
    setLoading(true);
    setError('');
    try {
      const buffer = await file.arrayBuffer();
      let text: string;
      const bytes = new Uint8Array(buffer);
      if (bytes[0] === 0xff && bytes[1] === 0xfe) text = new TextDecoder('utf-16le').decode(buffer);
      else if (bytes[0] === 0xfe && bytes[1] === 0xff) text = new TextDecoder('utf-16be').decode(buffer);
      else {
        try { text = new TextDecoder('utf-8', { fatal: true }).decode(buffer); }
        catch { text = new TextDecoder('gb18030').decode(buffer); }
      }
      if (version !== inputVersion.current) return;
      setSource(text);
      setFileName(file.name);
      setNotice('字幕文件已载入');
    } catch {
      if (version === inputVersion.current) setError('文件读取失败，请重新选择文件。');
    } finally {
      if (version === inputVersion.current) setLoading(false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLTextAreaElement>) {
    inputVersion.current++;
    setLoading(false);
    setSource(event.target.value);
    setFileName('');
    setError('');
  }
  function loadExample() {
    inputVersion.current++;
    setLoading(false);
    setSource(exampleSrt);
    setFileName('示例字幕.srt');
    setError('');
  }
  function clear() {
    inputVersion.current++;
    setLoading(false);
    setSource('');
    setFileName('');
    setError('');
    fileInput.current?.focus();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setNotice('已复制全部文本');
    } catch { setError('无法访问剪贴板，请在右侧文本框中手动选择并复制。'); }
  }
  function download() {
    const url = URL.createObjectURL(new Blob(['\uFEFF', output], { type: 'text/plain;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${fileName ? fileName.replace(/\.[^.]+$/, '') : '字幕文本'}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice('文本已导出');
  }
  function drop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setDragging(false);
    void readFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./" aria-label="拾句首页"><span className="brand-mark"><Icon name="lines" width="23" height="23" /></span><span>拾句<span className="brand-divider">/</span><span className="brand-description">字幕文本提取</span></span></a>
        <span className="header-badge"><span className="status-dot" />免费 · 无需登录</span>
      </header>

      <main>
        <section className="intro">
          <span className="eyebrow"><Icon name="spark" width="14" height="14" /> LESS TIMECODE, MORE WORDS</span>
          <h1>让字幕，只剩下<span>文字。</span></h1>
          <p>去掉时间轴与序号，把 SRT 变成干净的文本。<br className="mobile-break" />一条字幕，一行文字。</p>
        </section>

        <section className="workspace" aria-label="字幕提取工作区">
          <section className={`editor-panel input-panel${dragging ? ' is-dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setDragging(false); }} onDrop={drop} aria-labelledby="source-heading">
            <div className="panel-heading"><div className="panel-title"><span className="step">01</span><h2 id="source-heading">原始字幕</h2><span className="format-tag">SRT</span></div><button className="text-button" onClick={loadExample}>试试示例<Icon name="arrow" width="14" height="14" /></button></div>
            <div className="upload-area">
              <input ref={fileInput} className="file-input" type="file" id="subtitle-file" accept=".srt,.txt" aria-label="上传字幕文件" onChange={event => { void readFile(event.target.files?.[0]); event.target.value = ''; }} />
              <label className="upload-button" htmlFor="subtitle-file"><Icon name={fileName ? 'file' : 'upload'} /><span>{loading ? '正在读取…' : fileName || '点击上传字幕文件'}</span></label>
              <span className="upload-hint">或拖拽文件到这里<span>支持 .srt / .txt，最大 10 MB</span></span>
            </div>
            <div className="input-editor"><label className="sr-only" htmlFor="source">SRT 字幕内容</label><textarea id="source" value={source} onChange={handleChange} spellCheck={false} placeholder={'也可以直接粘贴 SRT 内容…\n\n1\n00:00:01,000 --> 00:00:03,500\n每一句话，都值得被好好留下。\n\n2\n00:00:04,000 --> 00:00:06,000\n让文字回归文字。'} /></div>
            <div className="panel-footer"><span>{source ? `${source.length.toLocaleString()} 个字符` : '等待输入字幕内容'}</span><button className="text-button muted" disabled={!source && !loading} onClick={clear}><Icon name="close" width="14" height="14" />清空</button></div>
          </section>

          <div className="flow-arrow"><Icon name="arrow" width="17" height="17" /></div>

          <section className="editor-panel output-panel" aria-labelledby="output-heading">
            <div className="panel-heading"><div className="panel-title"><span className="step">02</span><h2 id="output-heading">提取结果</h2><span className="format-tag result-tag">TXT</span></div><span className="live-label"><span className="status-dot" />实时生成</span></div>
            <div className="output-body">
              {output ? <><label className="sr-only" htmlFor="output">提取后的字幕文本，每条字幕一行</label><textarea id="output" className="result-text" value={output} readOnly spellCheck={false} /></> : <div className="empty-state"><span className="empty-icon"><Icon name="lines" width="30" height="30" /><span className="empty-check"><Icon name="check" width="11" height="11" /></span></span><h3>{source.trim() ? '还没有识别到字幕' : '文字，在这里相遇'}</h3><p>{source.trim() ? '请检查内容是否包含完整的 SRT 时间轴。' : '上传文件或粘贴字幕，纯净文本即刻呈现。'}</p><span className="empty-preview"><i /><i /><i /></span></div>}
            </div>
            <div className="panel-footer"><span className={output ? 'result-count' : ''}>{subtitles.length} 条字幕<span className="count-divider">·</span>{characterCount.toLocaleString()} 字</span><span>每条字幕一行</span></div>
          </section>
        </section>

        <div className="action-bar"><label className="checkbox-label" htmlFor={optionId}><input id={optionId} type="checkbox" checked={deduplicate} onChange={event => setDeduplicate(event.target.checked)} />去除重复字幕<span className="option-note">保留首次出现的句子</span></label><div className="export-actions"><button className="button button-secondary" disabled={!output} onClick={download}><Icon name="download" />下载 TXT</button><button className="button button-primary" disabled={!output} onClick={() => void copy()}><Icon name={copied ? 'check' : 'copy'} />{copied ? '已复制文本' : '复制全部文本'}</button></div></div>
        {error && <div className="error-message" role="alert">{error}<button aria-label="关闭提示" onClick={() => setError('')}><Icon name="close" width="15" height="15" /></button></div>}

        <div className="feature-notes"><span><Icon name="check" />自动去除序号与时间轴</span><span><Icon name="check" />多行字幕合并为一行</span><span><Icon name="check" />清理样式标签</span></div>
      </main>

      <footer className="site-footer"><span>拾句<span className="footer-dot">·</span>把注意力留给文字</span><span><Icon name="shield" width="14" height="14" />文件仅在浏览器本地处理，不会上传</span></footer>
      {notice && <div className="toast" role="status"><Icon name="check" />{notice}</div>}
    </div>
  );
}
