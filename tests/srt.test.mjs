import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSubtitles, exampleSrt } from '../src/lib/srt.ts';

test('one line per cue; wrapped subtitle text is joined', () => {
  assert.deepEqual(extractSubtitles(exampleSrt), [
    '生活中的美好，往往藏在细节里。',
    '放慢脚步， 听听这个世界的声音。',
    '把喜欢的句子，留给自己。',
  ]);
});
test('handles BOM, CRLF, dot timestamps, and adjacent cues', () => {
  assert.deepEqual(extractSubtitles('\uFEFF1\r\n00:00:01.000 --> 00:00:02.000\r\n第一句\r\n2\r\n00:00:03.000 --> 00:00:04.000\r\n第二句'), ['第一句', '第二句']);
});
test('removes formatting and decodes entities while preserving literal comparison signs', () => {
  assert.deepEqual(extractSubtitles('1\n00:00:01,000 --> 00:00:02,000\n{\\an8}<i>Tom &amp; Jerry</i><br>2 < 3 &lt;test&gt; &#128578;'), ['Tom & Jerry 2 < 3 <test> 🙂']);
});
test('numeric subtitle content is kept and empty cues are ignored', () => {
  assert.deepEqual(extractSubtitles('1\n00:00:01,000 --> 00:00:02,000\n2026\n\n2\n00:00:03,000 --> 00:00:04,000\n\n3\n00:00:05,000 --> 00:00:06,000\n最后一句'), ['2026', '最后一句']);
});
test('deduplication is optional and keeps the first occurrence', () => {
  const source = '1\n00:00:01,000 --> 00:00:02,000\n你好\n\n2\n00:00:03,000 --> 00:00:04,000\n你好';
  assert.deepEqual(extractSubtitles(source), ['你好', '你好']);
  assert.deepEqual(extractSubtitles(source, true), ['你好']);
});
test('empty input and invalid SRT return no subtitles', () => {
  assert.deepEqual(extractSubtitles(''), []);
  assert.deepEqual(extractSubtitles('普通文本\n1\nnot a timestamp'), []);
});
test('invalid Unicode entities do not crash extraction', () => {
  assert.deepEqual(extractSubtitles('1\n00:00:01,000 --> 00:00:02,000\n&#99999999; &#xD800; &nbsp;'), ['&#99999999; &#xD800;']);
});
