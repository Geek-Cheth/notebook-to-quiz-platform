const QUIZ_URL =
  'https://notebooklm.google.com/notebook/d523dbcc-ae2d-4987-a93e-f354523743f0/artifact/7a86bb7e-8071-4d7d-bac9-9d6036f188f9';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function post({ bl, fSid, skipReferer }) {
  const artifactId = '7a86bb7e-8071-4d7d-bac9-9d6036f188f9';
  const notebookId = 'd523dbcc-ae2d-4987-a93e-f354523743f0';
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
  const rpcPayload = JSON.stringify([[['v9rmvd', inner, null, 'generic']]]);
  const params = new URLSearchParams({
    rpcids: 'v9rmvd',
    'source-path': `/notebook/${notebookId}/artifact/${artifactId}`,
    'f.sid': fSid || '',
    bl: bl || '',
    hl: 'en',
    'soc-app': '1',
    'soc-platform': '1',
    'soc-device': '1',
    _reqid: '123456',
    rt: 'c',
  });
  const url =
    'https://notebooklm.google.com/_/LabsTailwindUi/data/batchexecute?' +
    params.toString();
  const headers = {
    'User-Agent': UA,
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    Accept: '*/*',
    Origin: 'https://notebooklm.google.com',
    'X-Same-Domain': '1',
  };
  if (!skipReferer) headers.Referer = QUIZ_URL;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: 'f.req=' + encodeURIComponent(rpcPayload),
  });
  const text = await res.text();
  return { status: res.status, len: text.length, ok: text.includes('v9rmvd') };
}

async function main() {
  const pageRes = await fetch(QUIZ_URL, { headers: { 'User-Agent': UA } });
  const html = await pageRes.text();
  const bl = html.match(/"cfb2h"\s*:\s*"([^"]+)"/)?.[1];
  const fSid = html.match(/"FdrFJe"\s*:\s*"([^"]+)"/)?.[1];

  console.log('fresh bl from page:', bl);
  console.log('POST no page GET, stale bl:', await post({ bl: 'boq_labs-tailwind-frontend_20260101.00_p0', fSid: '' }));
  console.log('POST no bl:', await post({ bl: '', fSid: '' }));
  console.log('POST fresh bl, no f.sid:', await post({ bl, fSid: '' }));
  console.log('POST fresh bl, no referer:', await post({ bl, fSid: '', skipReferer: true }));
  console.log('POST fresh bl + f.sid:', await post({ bl, fSid }));
}

main();
