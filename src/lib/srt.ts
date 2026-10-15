const timestamp = /^\s*\d{1,3}:\d{2}:\d{2}[,.]\d{1,3}\s*-->\s*\d{1,3}:\d{2}:\d{2}[,.]\d{1,3}(?:\s+.*)?\s*$/;

const entities: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
};

function cleanText(text: string): string {
  return text
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, '')
    .replace(/\{\\[^}]*\}/g, '')
    .replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (original, entity: string) => {
      if (!entity.startsWith('#')) return entities[entity.toLowerCase()] ?? original;
      const code = entity[1].toLowerCase() === 'x'
        ? Number.parseInt(entity.slice(2), 16)
        : Number.parseInt(entity.slice(1), 10);
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
        ? String.fromCodePoint(code) : original;
    })
    .replace(/\s+/g, ' ')
    .trim();
}

/** Each timestamp starts a cue; wrapped text within that cue becomes one line. */
export function extractSubtitles(source: string, deduplicate = false): string[] {
  const lines = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
  const result: string[] = [];
  let cue: string[] | null = null;
  const flush = () => {
    if (!cue) return;
    const text = cleanText(cue.join(' '));
    if (text) result.push(text);
    cue = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (timestamp.test(line)) {
      flush();
      cue = [];
    } else if (!line) {
      flush();
    } else if (/^\d+$/.test(line) && timestamp.test(lines[i + 1] ?? '')) {
      flush();
    } else if (cue) {
      cue.push(line);
    }
  }
  flush();
  return deduplicate ? [...new Set(result)] : result;
}

export const exampleSrt = `1
00:00:01,000 --> 00:00:03,500
生活中的美好，往往藏在细节里。

2
00:00:04,000 --> 00:00:07,000
放慢脚步，
听听这个世界的声音。

3
00:00:08,000 --> 00:00:11,000
把喜欢的句子，留给自己。`;
