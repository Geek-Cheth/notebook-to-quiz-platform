/**
 * Extract all questions from a public NotebookLM quiz share URL.
 * Uses Playwright frame access + UI automation to capture Q/A + correct answers.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const QUIZ_URL =
  process.argv[2] ||
  'https://notebooklm.google.com/notebook/d523dbcc-ae2d-4987-a93e-f354523743f0/artifact/7a86bb7e-8071-4d7d-bac9-9d6036f188f9';

const OUT_DIR = path.join(__dirname, '..', 'data');
const OUT_FILE = path.join(OUT_DIR, 'digital-quiz.json');

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseQuizFromBatchexecute(text) {
  if (!text) return null;
  const cleaned = text.replace(/^\)\]\}'\n?/, '');
  try {
    const outer = JSON.parse(cleaned);
    const payload = JSON.stringify(outer);
    const questions = [];
    const qRegex = /"([^"\\]{20,500}\?)"/g;
    let m;
    while ((m = qRegex.exec(payload)) !== null) {
      questions.push(m[1]);
    }
    if (questions.length >= 5) {
      return { source: 'batchexecute-heuristic', questions };
    }
  } catch {
    /* fall through */
  }
  return null;
}

async function getQuizFrame(page) {
  for (let i = 0; i < 30; i++) {
    const frame = page.frames().find((f) => /usercontent\.goog/.test(f.url()));
    if (frame) return frame;
    await sleep(500);
  }
  throw new Error('Quiz iframe not found');
}

async function readQuestionFromFrame(frame) {
  return frame.evaluate(() => {
    const text = document.body?.innerText || '';
    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const progressIdx = lines.findIndex((l) => /^\d+\s*\/\s*\d+$/.test(l));
    const progress = progressIdx >= 0 ? lines[progressIdx] : null;

    const optionStarts = lines
      .map((l, i) => (/^[A-D]\.\s/.test(l) ? i : -1))
      .filter((i) => i >= 0);

    let question = '';
    if (optionStarts.length > 0) {
      const firstOpt = optionStarts[0];
      const start = progressIdx >= 0 ? progressIdx + 1 : 0;
      question = lines.slice(start, firstOpt).join(' ').trim();
    }

    const options = optionStarts.map((i) => lines[i].replace(/^[A-D]\.\s*/, '').trim());

    const selected = [...document.querySelectorAll('[aria-checked="true"], [aria-selected="true"], .selected, .correct, .incorrect')]
      .map((el) => (el.innerText || el.textContent || '').trim())
      .filter(Boolean);

    const feedback = lines.filter((l) =>
      /correct|incorrect|right answer|the answer is/i.test(l)
    );

    return { text, progress, question, options, selected, feedback, lines };
  });
}

async function clickOption(frame, index) {
  const clicked = await frame.evaluate((idx) => {
    const candidates = [
      ...document.querySelectorAll('button'),
      ...document.querySelectorAll('[role="button"]'),
      ...document.querySelectorAll('[role="radio"]'),
      ...document.querySelectorAll('[role="option"]'),
      ...document.querySelectorAll('label'),
      ...document.querySelectorAll('div'),
    ];

    const letter = String.fromCharCode(65 + idx);
    for (const el of candidates) {
      const t = (el.innerText || el.textContent || '').trim();
      if (t.startsWith(`${letter}.`) || t === letter || new RegExp(`^${letter}\\b`).test(t)) {
        el.click();
        return true;
      }
    }

    const opts = [...document.querySelectorAll('*')].filter((el) => {
      const t = (el.innerText || '').trim();
      return /^[A-D]\.\s/.test(t) && el.children.length <= 2;
    });
    if (opts[idx]) {
      opts[idx].click();
      return true;
    }
    return false;
  }, index);

  if (!clicked) {
    const locator = frame.getByText(new RegExp(`^${String.fromCharCode(65 + index)}\\.`));
    if (await locator.count()) {
      await locator.first().click({ force: true });
      return true;
    }
  }
  return clicked;
}

async function clickNext(frame) {
  const clicked = await frame.evaluate(() => {
    const buttons = [...document.querySelectorAll('button, [role="button"]')];
    for (const b of buttons) {
      const t = (b.innerText || b.textContent || '').trim();
      if (/^next$/i.test(t)) {
        b.click();
        return true;
      }
    }
    return false;
  });
  if (!clicked) {
    const nextBtn = frame.getByRole('button', { name: /^next$/i });
    if (await nextBtn.count()) {
      await nextBtn.first().click({ force: true });
      return true;
    }
  }
  return clicked;
}

async function detectCorrectIndex(frame, options) {
  const result = await frame.evaluate(() => {
    const lines = (document.body?.innerText || '').split('\n').map((l) => l.trim());
    const feedback = lines.filter((l) =>
      /correct|right answer|the answer is|well done|not quite/i.test(l)
    );

    const marked = [...document.querySelectorAll('*')].map((el) => {
      const cls = (el.className || '').toString().toLowerCase();
      const style = getComputedStyle(el);
      const t = (el.innerText || el.textContent || '').trim();
      const looksCorrect =
        /correct|right|success|valid/i.test(cls) ||
        style.color.includes('rgb(0, 128') ||
        style.backgroundColor.includes('rgb(0, 128') ||
        el.getAttribute('aria-checked') === 'true';
      const looksWrong = /incorrect|wrong|error|invalid/i.test(cls);
      return { t, looksCorrect, looksWrong };
    });

    return { feedback, marked };
  });

  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const hit = result.marked.find(
      (m) => m.t.includes(opt) && (m.looksCorrect || (!m.looksWrong && m.t.length < 120))
    );
    if (hit?.looksCorrect) return i;
  }

  for (const fb of result.feedback) {
    for (let i = 0; i < options.length; i++) {
      if (fb.includes(options[i])) return i;
    }
  }

  return -1;
}

async function extractViaUi(page, frame, total) {
  const questions = [];

  for (let n = 1; n <= total; n++) {
    await sleep(800);
    let data = await readQuestionFromFrame(frame);

    if (!data.question || data.options.length < 4) {
      await sleep(1000);
      data = await readQuestionFromFrame(frame);
    }

    let correctIndex = -1;
    let correctVia = null;

    for (let i = 0; i < 4; i++) {
      await clickOption(frame, i);
      await sleep(700);
      const after = await readQuestionFromFrame(frame);
      const idx = await detectCorrectIndex(frame, data.options);
      if (idx >= 0) {
        correctIndex = idx;
        correctVia = 'click-feedback';
        break;
      }
      if (after.feedback?.length) {
        for (const fb of after.feedback) {
          for (let j = 0; j < data.options.length; j++) {
            if (fb.toLowerCase().includes('correct') && fb.includes(data.options[j])) {
              correctIndex = j;
              correctVia = 'text-feedback';
              break;
            }
          }
        }
        if (correctIndex >= 0) break;
      }
    }

    const progressMatch = data.progress?.match(/(\d+)\s*\/\s*(\d+)/);
    const qNum = progressMatch ? parseInt(progressMatch[1], 10) : n;

    questions.push({
      number: qNum,
      text: data.question,
      options: data.options.slice(0, 4),
      correctIndex,
      correctAnswer: correctIndex >= 0 ? data.options[correctIndex] : null,
      correctVia,
    });

    console.log(`[${qNum}/${total}] ${data.question.slice(0, 80)}... => ${correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '?'}`);

    if (n < total) {
      const moved = await clickNext(frame);
      if (!moved) throw new Error(`Failed to click Next on question ${n}`);
      await sleep(900);
    }
  }

  return questions;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let batchexecuteBody = null;
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('batchexecute') && url.includes('v9rmvd')) {
      try {
        batchexecuteBody = await response.text();
        fs.writeFileSync(path.join(OUT_DIR, 'batchexecute-raw.txt'), batchexecuteBody, 'utf8');
        console.log('Captured batchexecute response:', batchexecuteBody.length, 'bytes');
      } catch (e) {
        console.warn('Failed to read batchexecute body:', e.message);
      }
    }
  });

  console.log('Loading quiz:', QUIZ_URL);
  await page.goto(QUIZ_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  const frame = await getQuizFrame(page);
  console.log('Found quiz frame:', frame.url());

  const initial = await readQuestionFromFrame(frame);
  const totalMatch = initial.progress?.match(/\d+\s*\/\s*(\d+)/);
  const total = totalMatch ? parseInt(totalMatch[1], 10) : 26;
  console.log('Total questions:', total);

  let questions = null;
  const parsed = parseQuizFromBatchexecute(batchexecuteBody);
  if (parsed?.questions?.length >= total) {
    console.log('Parsed questions from batchexecute');
    questions = parsed.questions.map((text, i) => ({ number: i + 1, text }));
  } else {
    console.log('Falling back to UI extraction...');
    questions = await extractViaUi(page, frame, total);
  }

  const output = {
    title: 'Digital Quiz',
    sourceUrl: QUIZ_URL,
    extractedAt: new Date().toISOString(),
    totalQuestions: questions.length,
    questions,
  };

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8');
  console.log('Saved to', OUT_FILE);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
