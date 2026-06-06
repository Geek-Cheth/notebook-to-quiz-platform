const fs = require('fs');
const path = require('path');

const RAW = path.join(__dirname, '..', 'data', 'batchexecute-raw.txt');
const OUT = path.join(__dirname, '..', 'data', 'digital-quiz.json');
const HTML_OUT = path.join(__dirname, '..', 'data', 'quiz.html');

function parseBatchexecuteRaw(raw) {
  const text = raw.replace(/^\)\]\}'\n?/, '').trim();
  const lines = text.split('\n');
  const chunks = [];

  let i = 0;
  while (i < lines.length) {
    const len = parseInt(lines[i], 10);
    if (!Number.isFinite(len)) {
      i++;
      continue;
    }
    i++;
    const chunk = lines.slice(i, i + 1).join('\n');
    if (chunk) chunks.push(JSON.parse(chunk));
    i += 1;
    while (i < lines.length && lines[i].trim() === '') i++;
  }

  return chunks.length ? chunks : [JSON.parse(text)];
}

function extractV9Payload(raw) {
  const chunks = parseBatchexecuteRaw(raw).flat();
  for (const item of chunks) {
    if (Array.isArray(item) && item[1] === 'v9rmvd' && typeof item[2] === 'string') {
      return JSON.parse(item[2]);
    }
  }
  throw new Error('v9rmvd payload not found');
}

function extractHtmlFromPayload(payload) {
  const json = JSON.stringify(payload);
  const start = json.indexOf('<!doctype html');
  if (start < 0) throw new Error('Quiz HTML not found');
  const end = json.indexOf('</html>', start);
  if (end < 0) throw new Error('Quiz HTML end not found');
  return json.slice(start, end + '</html>'.length).replace(/\\n/g, '\n').replace(/\\"/g, '"');
}

function decodeHtmlEntities(str) {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'");
}

function cleanOptionText(text) {
  return text.replace(/\$/g, '').trim();
}

function extractQuizFromHtml(html) {
  const match = html.match(/data-app-data="\s*([\s\S]*?)\s*"/i);
  if (!match) throw new Error('data-app-data not found');

  const jsonText = decodeHtmlEntities(match[1].trim());
  const data = JSON.parse(jsonText);
  const quiz = data.quiz || data.questions || data.items;
  if (!Array.isArray(quiz)) throw new Error('quiz array not found in data-app-data');

  return quiz.map((item, i) => {
    const options = (item.answerOptions || item.options || []).map((o) =>
      cleanOptionText(typeof o === 'string' ? o : o.text)
    );
    const correctIndex = (item.answerOptions || item.options || []).findIndex((o) =>
      typeof o === 'object' ? o.isCorrect : false
    );

    return {
      number: i + 1,
      text: item.question || item.text,
      options,
      correctIndex,
      correctAnswer: correctIndex >= 0 ? options[correctIndex] : null,
      rationale: (item.answerOptions || []).find((o) => o.isCorrect)?.rationale || null,
    };
  });
}

function parseQuizFromRaw(raw, meta = {}) {
  const payload = extractV9Payload(raw);
  const html = extractHtmlFromPayload(payload);
  const questions = extractQuizFromHtml(html).map((q) => ({
    text: q.text,
    options: q.options,
    correctIndex: q.correctIndex,
    rationale: q.rationale,
  }));

  return {
    title: meta.title || 'Imported Quiz',
    sourceUrl: meta.sourceUrl || null,
    questions,
  };
}

function main() {
  const raw = fs.readFileSync(RAW, 'utf8');
  const payload = extractV9Payload(raw);
  const html = extractHtmlFromPayload(payload);
  fs.writeFileSync(HTML_OUT, html, 'utf8');

  const questions = extractQuizFromHtml(html);

  const output = {
    title: 'Digital Quiz',
    sourceUrl:
      'https://notebooklm.google.com/notebook/d523dbcc-ae2d-4987-a93e-f354523743f0/artifact/7a86bb7e-8071-4d7d-bac9-9d6036f188f9',
    extractedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    questions,
  };

  fs.writeFileSync(OUT, JSON.stringify(output, null, 2));
  console.log(`Extracted ${questions.length} questions -> ${OUT}`);

  for (const q of questions) {
    const letter = q.correctIndex >= 0 ? String.fromCharCode(65 + q.correctIndex) : '?';
    console.log(`\n${q.number}. [${letter}] ${q.text}`);
    q.options.forEach((opt, idx) => {
      console.log(`   ${String.fromCharCode(65 + idx)}) ${opt}${idx === q.correctIndex ? ' ✓' : ''}`);
    });
    if (q.rationale) console.log(`   Rationale: ${q.rationale.slice(0, 120)}...`);
  }
}

module.exports = {
  parseBatchexecuteRaw,
  extractV9Payload,
  extractHtmlFromPayload,
  extractQuizFromHtml,
  parseQuizFromRaw,
};

if (require.main === module) {
  main();
}
