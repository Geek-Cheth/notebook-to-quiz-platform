/**
 * Test whether NotebookLM quiz batchexecute (rpcids=v9rmvd) can be obtained
 * via plain HTTP fetch without Playwright.
 */
const fs = require('fs');
const path = require('path');
const { parseQuizFromRaw } = require('./parse-batchexecute.js');

const QUIZ_URL =
  process.argv[2] ||
  'https://notebooklm.google.com/notebook/d523dbcc-ae2d-4987-a93e-f354523743f0/artifact/7a86bb7e-8071-4d7d-bac9-9d6036f188f9';

const OUT_DIR = path.join(__dirname, '..', 'data');
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function extractFromHtml(html) {
  const findings = {};

  // Google batchexecute tokens commonly embedded in page scripts
  const patterns = {
    at: /"SNlM0e"\s*:\s*"([^"]+)"/,
    atAlt: /"at"\s*:\s*"([^"]+)"/,
    bl: /"cfb2h"\s*:\s*"([^"]+)"/,
    blAlt: /"bl"\s*:\s*"([^"]+)"/,
    fSid: /"FdrFJe"\s*:\s*"([^"]+)"/,
    fSidAlt: /"f\.sid"\s*:\s*"([^"]+)"/,
    buildLabel: /"cfb2h"\s*:\s*"([^"]+)"/,
    rpcid: /"v9rmvd"/,
    batchexecuteUrl: /"(https:\/\/[^"]*\/_\/[^"]*batchexecute[^"]*)"/,
    rpcData: /"v9rmvd"[^[]*\[([^\]]{20,500})\]/,
  };

  for (const [key, re] of Object.entries(patterns)) {
    const m = html.match(re);
    findings[key] = m ? (m[1] ?? true) : null;
  }

  // Artifact / notebook IDs from URL path
  const urlMatch = QUIZ_URL.match(
    /notebook\/([^/]+)\/artifact\/([^/?#]+)/
  );
  findings.notebookId = urlMatch?.[1] ?? null;
  findings.artifactId = urlMatch?.[2] ?? null;

  // Try direct quiz JSON in HTML
  findings.hasDataAppData = /data-app-data="/i.test(html);
  findings.hasQuizJson = /"answerOptions"/.test(html) || /"quiz"\s*:/.test(html);
  findings.hasIframe = /usercontent\.google/.test(html);

  // Extract build version from script URLs
  const buildMatch = html.match(/\/static\/([^/]+)\//);
  findings.staticBuild = buildMatch?.[1] ?? null;

  return findings;
}

function buildRpcPayload(artifactId, notebookId) {
  // Reconstructed from captured v9rmvd payload shape in batchexecute-raw.txt
  const inner = JSON.stringify([
    artifactId,
    null,
    notebookId,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    1,
  ]);
  return JSON.stringify([[['v9rmvd', inner, null, 'generic']]]);
}

async function fetchPage(url, cookieJar = '') {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': USER_AGENT,
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      ...(cookieJar ? { Cookie: cookieJar } : {}),
    },
  });

  const setCookies = [];
  res.headers.forEach((v, k) => {
    if (k.toLowerCase() === 'set-cookie') setCookies.push(v);
  });

  return {
    status: res.status,
    url: res.url,
    headers: Object.fromEntries(res.headers.entries()),
    setCookies,
    html: await res.text(),
  };
}

async function tryBatchexecutePost({ html, tokens, cookieJar }) {
  const results = [];

  const baseUrls = [
    'https://notebooklm.google.com/_/LabsTailwindUi/data/batchexecute',
    'https://notebooklm.google.com/_/NotebookLmUi/data/batchexecute',
  ];

  const at =
    tokens.at ||
    html.match(/"SNlM0e"\s*:\s*"([^"]+)"/)?.[1] ||
    html.match(/"at"\s*:\s*"([^"]+)"/)?.[1];
  const bl =
    tokens.bl ||
    html.match(/"cfb2h"\s*:\s*"([^"]+)"/)?.[1] ||
    html.match(/"bl"\s*:\s*"([^"]+)"/)?.[1];
  const fSid =
    tokens.fSid ||
    html.match(/"FdrFJe"\s*:\s*"([^"]+)"/)?.[1] ||
    html.match(/"f\.sid"\s*:\s*"([^"]+)"/)?.[1];

  const rpcPayload = buildRpcPayload(tokens.artifactId, tokens.notebookId);
  const fReq = encodeURIComponent(rpcPayload);

  for (const base of baseUrls) {
    const params = new URLSearchParams({
      rpcids: 'v9rmvd',
      'source-path': `/notebook/${tokens.notebookId}/artifact/${tokens.artifactId}`,
      'f.sid': fSid || '',
      bl: bl || '',
      hl: 'en',
      'soc-app': '1',
      'soc-platform': '1',
      'soc-device': '1',
      _reqid: String(Math.floor(Math.random() * 900000) + 100000),
      rt: 'c',
    });

    const url = `${base}?${params.toString()}`;
    const body = `f.req=${fReq}${at ? `&at=${encodeURIComponent(at)}` : ''}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'User-Agent': USER_AGENT,
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          Accept: '*/*',
          Origin: 'https://notebooklm.google.com',
          Referer: QUIZ_URL,
          'X-Same-Domain': '1',
          ...(cookieJar ? { Cookie: cookieJar } : {}),
        },
        body,
      });

      const text = await res.text();
      results.push({
        base,
        status: res.status,
        ok: res.ok,
        length: text.length,
        prefix: text.slice(0, 120),
        hasV9rmvd: text.includes('v9rmvd'),
        hasWrbFr: text.includes('wrb.fr'),
        looksLikeBatchexecute: text.startsWith(")]}'"),
      });
    } catch (err) {
      results.push({ base, error: err.message });
    }
  }

  return { at, bl, fSid, results };
}

function tryParseQuizFromHtml(html) {
  try {
    const match = html.match(/data-app-data="\s*([\s\S]*?)\s*"/i);
    if (!match) return { ok: false, reason: 'no data-app-data in HTML' };
    const jsonText = match[1]
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'");
    const data = JSON.parse(jsonText);
    const quiz = data.quiz || data.questions || data.items;
    if (!Array.isArray(quiz)) return { ok: false, reason: 'no quiz array' };
    return { ok: true, count: quiz.length };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('=== NotebookLM fetch-only import test ===');
  console.log('URL:', QUIZ_URL);
  console.log('');

  // Step 1: GET artifact page
  console.log('--- Step 1: GET artifact page ---');
  const page = await fetchPage(QUIZ_URL);
  console.log('Status:', page.status);
  console.log('Final URL:', page.url);
  console.log('HTML length:', page.html.length);
  console.log('Set-Cookie count:', page.setCookies.length);

  fs.writeFileSync(path.join(OUT_DIR, 'fetch-page.html'), page.html, 'utf8');

  const tokens = extractFromHtml(page.html);
  console.log('Extracted tokens:', JSON.stringify(tokens, null, 2));

  const cookieJar = page.setCookies
    .map((c) => c.split(';')[0])
    .filter(Boolean)
    .join('; ');

  // Step 2: Check if quiz is in initial HTML
  console.log('\n--- Step 2: Quiz in initial HTML? ---');
  const htmlQuiz = tryParseQuizFromHtml(page.html);
  console.log('Result:', htmlQuiz);

  // Step 3: Try batchexecute POST
  console.log('\n--- Step 3: POST batchexecute (v9rmvd) ---');
  const batchexecute = await tryBatchexecutePost({
    html: page.html,
    tokens,
    cookieJar,
  });
  console.log('Tokens used:', {
    at: batchexecute.at ? `${batchexecute.at.slice(0, 20)}...` : null,
    bl: batchexecute.bl,
    fSid: batchexecute.fSid,
  });
  console.log('POST results:', JSON.stringify(batchexecute.results, null, 2));

  let fetchWorks = false;
  let rawBody = null;

  for (const r of batchexecute.results) {
    if (r.looksLikeBatchexecute && r.hasV9rmvd && r.length > 1000) {
      fetchWorks = true;
      // Re-fetch to save full body (we only have prefix above)
    }
  }

  // Re-run successful POST and save raw if any candidate looks good
  const best = batchexecute.results.find(
    (r) => r.looksLikeBatchexecute && r.hasV9rmvd && r.length > 1000
  );

  if (best) {
    console.log('\n--- Step 4: Re-fetch successful batchexecute ---');
    // Already have prefix; do full fetch for the winning base
    const base = best.base;
    const at = batchexecute.at;
    const bl = batchexecute.bl;
    const fSid = batchexecute.fSid;
    const rpcPayload = buildRpcPayload(tokens.artifactId, tokens.notebookId);
    const fReq = encodeURIComponent(rpcPayload);
    const params = new URLSearchParams({
      rpcids: 'v9rmvd',
      'source-path': `/notebook/${tokens.notebookId}/artifact/${tokens.artifactId}`,
      'f.sid': fSid || '',
      bl: bl || '',
      hl: 'en',
      'soc-app': '1',
      'soc-platform': '1',
      'soc-device': '1',
      _reqid: String(Math.floor(Math.random() * 900000) + 100000),
      rt: 'c',
    });
    const url = `${base}?${params.toString()}`;
    const body = `f.req=${fReq}${at ? `&at=${encodeURIComponent(at)}` : ''}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        Accept: '*/*',
        Origin: 'https://notebooklm.google.com',
        Referer: QUIZ_URL,
        'X-Same-Domain': '1',
        Cookie: cookieJar,
      },
      body,
    });
    rawBody = await res.text();
    fs.writeFileSync(path.join(OUT_DIR, 'fetch-batchexecute-raw.txt'), rawBody, 'utf8');
    console.log('Saved fetch-batchexecute-raw.txt, length:', rawBody.length);

    try {
      const parsed = parseQuizFromRaw(rawBody, { sourceUrl: QUIZ_URL });
      console.log('Parsed questions:', parsed.questions.length);
      fs.writeFileSync(
        path.join(OUT_DIR, 'fetch-quiz.json'),
        JSON.stringify(parsed, null, 2),
        'utf8'
      );
    } catch (err) {
      console.log('Parse failed:', err.message);
    }
  }

  // Summary
  console.log('\n=== SUMMARY ===');
  console.log('Fetch-only works:', fetchWorks || htmlQuiz.ok);
  console.log('Quiz in HTML:', htmlQuiz.ok ? `yes (${htmlQuiz.count} questions)` : htmlQuiz.reason);
  console.log('Batchexecute via fetch:', fetchWorks ? 'yes' : 'no');
  if (!fetchWorks && !htmlQuiz.ok) {
    console.log('\nLikely requirements if fetch fails:');
    console.log('- Google auth cookies (SAPISID, SID, etc.) for private artifacts');
    console.log('- Valid at/SNlM0e anti-CSRF token from page HTML');
    console.log('- Correct f.req RPC payload shape for v9rmvd');
    console.log('- f.sid session id and bl build label from page bootstrap');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
