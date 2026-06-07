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
  return text.trim();
}

/** FNV-1a hash for deterministic per-question shuffle seeds. */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
}

/**
 * NotebookLM stores the correct option first in source data and shuffles in its UI.
 * We shuffle on import so the correct answer is not always choice A.
 */
function shuffleQuestionOptions(options, correctIndex, seedKey) {
  if (options.length <= 1 || correctIndex < 0) {
    return { options, correctIndex };
  }

  const rng = seededRandom(hashSeed(seedKey));
  const indexed = options.map((text, i) => ({
    text,
    isCorrect: i === correctIndex,
  }));

  for (let i = indexed.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [indexed[i], indexed[j]] = [indexed[j], indexed[i]];
  }

  return {
    options: indexed.map((entry) => entry.text),
    correctIndex: indexed.findIndex((entry) => entry.isCorrect),
  };
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
    const rawCorrectIndex = (item.answerOptions || item.options || []).findIndex((o) =>
      typeof o === 'object' ? o.isCorrect : false
    );
    const questionText = item.question || item.text;
    const shuffled = shuffleQuestionOptions(
      options,
      rawCorrectIndex,
      `${i + 1}:${questionText}`
    );

    return {
      number: i + 1,
      text: questionText,
      options: shuffled.options,
      correctIndex: shuffled.correctIndex,
      correctAnswer:
        shuffled.correctIndex >= 0
          ? shuffled.options[shuffled.correctIndex]
          : null,
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
  shuffleQuestionOptions,
};

if (require.main === module) {
  main();
}
