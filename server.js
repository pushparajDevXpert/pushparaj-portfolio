/**
 * Zero-dependency Node.js server for the portfolio and optional AI assistant.
 * Requires Node.js 18+.
 * Keep GEMINI_API_KEY or OPENAI_API_KEY in .env or the server environment, never in frontend files.
 */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');

const ROOT = __dirname;
const envPath = path.join(ROOT, '.env');
if (fs.existsSync(envPath)) {
  for (const raw of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = raw.trim(); if (!line || line.startsWith('#')) continue;
    const at = line.indexOf('='); if (at < 0) continue;
    const key = line.slice(0,at).trim();
    const value = line.slice(at+1).trim().replace(/^(['"])(.*)\1$/, '$2');
    if (key && !Object.prototype.hasOwnProperty.call(process.env,key)) process.env[key] = value;
  }
}
const PORT = Number(process.env.PORT || 3000);
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
// Gemini takes priority when both keys are present.
const PROVIDER = GEMINI_KEY ? 'gemini' : OPENAI_KEY ? 'openai' : 'demo';
const profile = JSON.parse(fs.readFileSync(path.join(ROOT, 'site-data.json'), 'utf8'));
const allowedFiles = new Set(['/','/index.html','/styles.css','/app.js','/site-data.json','/favicon.svg']);
allowedFiles.add('/resume.pdf');
allowedFiles.add('/ai-bot-logo.png');
const mime = {'.pdf':'application/pdf','.png':'image/png','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
const recent = new Map();

function send(res, status, body, contentType='application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': contentType, 'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy':'strict-origin-when-cross-origin',
    'X-Frame-Options':'DENY',
    'Cache-Control': 'no-store'
  });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function demoReply(message) {
  const q = message.toLowerCase();
  if (/project|portfolio|work|build|made/.test(q)) return `The sample projects currently shown are: ${profile.projects.map(p=>p.title).join(', ')}. These are starter examples, not verified completed projects.`;
  if (/skill|tech|expert|tool|software|python|stack|django|fastapi|react|backend|frontend|sql|api/.test(q)) return `The portfolio presents an editable example stack: ${profile.skills.join(', ')}. Please verify individual tools with Pushparaj before describing them as professional experience.`;
  if (/\b(ai|ml|llm|data science|machine learning|analytics|model|rag|prediction)\b/.test(q)) return `Pushparaj's portfolio focuses on full-stack Python, AI, and Data Science. All AI and analytics projects currently shown are SAMPLE PROJECT concepts, not verified completed work.`;
  if (/contact|email|hire|reach|linkedin|github|resume/.test(q)) return !profile.email || profile.email === 'your.email@example.com' ? 'A public contact email is not configured yet. The GitHub profile is linked on the website.' : `You can contact ${profile.name} at ${profile.email}.`;
  if (/where|location|based/.test(q)) return `The portfolio lists ${profile.location}.`;
  return `Hi! I can tell you about ${profile.shortName}'s skills, sample projects, or contact information. This is the demo assistant. Add a server-side API key for live AI answers.`;
}
function assistantInstructions() {
  const facts = JSON.stringify(profile);
  return `You are a helpful conversational guide embedded in ${profile.name}'s personal full-stack Python, AI and Data Science portfolio. Only use facts in the following JSON. If details are missing, say so rather than inventing experience, degrees, employers, awards, or accomplishments. Treat cards marked SAMPLE PROJECT as placeholders, NEVER real completed work. You are an assistant, not ${profile.name} personally. Keep answers concise and welcoming (under 130 words). Provide accurate contact links only when specified. Portfolio JSON: ${facts}`;
}
async function getOpenAIReply(message) {
  const instructions = assistantInstructions();
  const controller = new AbortController();
  const timeout = setTimeout(()=>controller.abort(),18000);
  try {
    const reply = await fetch('https://api.openai.com/v1/responses', {
      method:'POST', headers:{'Authorization':`Bearer ${OPENAI_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({model:OPENAI_MODEL,instructions,input:message,max_output_tokens:300}),
      signal:controller.signal
    });
    const payload = await reply.json();
    if (!reply.ok) throw new Error(payload.error?.message || `OpenAI API error ${reply.status}`);
    const output = (payload.output || []).flatMap(item => item.content || []).filter(item => item.type === 'output_text').map(item=>item.text).join('\n').trim();
    if (!output) throw new Error('No response text returned');
    return output;
  } finally { clearTimeout(timeout); }
}


async function getGeminiReply(message) {
  if (!/^[A-Za-z0-9_.-]{1,80}$/.test(GEMINI_MODEL)) throw new Error('Invalid Gemini model name');
  for (let attempt = 0; attempt < 3; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const reply = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`, {
        method: 'POST',
        headers: { 'x-goog-api-key': GEMINI_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: assistantInstructions() }] },
          contents: [{ role: 'user', parts: [{ text: message }] }]
        }),
        signal: controller.signal
      });
      const payload = await reply.json();
      if (!reply.ok) {
        const error = new Error(payload.error?.message || `Gemini API error ${reply.status}`);
        error.statusCode = reply.status;
        throw error;
      }
      const output = (payload.candidates?.[0]?.content?.parts || [])
        .filter(part => typeof part.text === 'string')
        .map(part => part.text).join('\n').trim();
      if (!output) throw new Error('No response text returned from Gemini');
      return output;
    } catch (error) {
      const temporary = [429, 500, 502, 503, 504].includes(error.statusCode) ||
        ['AbortError', 'TimeoutError', 'TypeError'].includes(error.name);
      if (!temporary || attempt === 2) throw error;
      console.warn(`Temporary Gemini failure; retry ${attempt + 1}/2`);
      await new Promise(resolve => setTimeout(resolve, 900 * (2 ** attempt) + Math.random() * 350));
    } finally { clearTimeout(timeout); }
  }
}

const server = http.createServer(async(req,res)=>{
  let pathname;
  try { pathname = new URL(req.url, 'http://localhost').pathname; } catch { return send(res,400,{error:'Invalid request'}); }
  if (req.method === 'GET' && pathname === '/api/resume-status') return send(res,200,{available:fs.existsSync(path.join(ROOT,'resume.pdf'))});
  if (req.method === 'GET' && pathname === '/api/status') return send(res,200,{mode:PROVIDER==='demo'?'demo':'ai',provider:PROVIDER});
  if (req.method === 'POST' && pathname === '/api/chat') {
    if (!String(req.headers['content-type']||'').startsWith('application/json')) return send(res,415,{error:'JSON body required'});
    const ip = req.socket.remoteAddress || 'unknown';
    const now = Date.now(); const usage = recent.get(ip) || [];
    const windowed = usage.filter(time => now-time<60000);
    if (windowed.length >= 20) return send(res,429,{error:'Too many messages. Try again shortly.'});
    windowed.push(now); recent.set(ip,windowed);
    let body = '';
    try {
      for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body)>4096) return send(res,413,{error:'Message too large'}); }
      const parsed = JSON.parse(body);
      if (typeof parsed.message !== 'string' || !parsed.message.trim() || parsed.message.length > 500) return send(res,400,{error:'Message must be 1–500 characters'});
      const message = parsed.message.trim();
      if (PROVIDER === 'demo') return send(res,200,{reply:demoReply(message),mode:'demo'});
      try { return send(res,200,{reply:await (PROVIDER==='gemini'?getGeminiReply(message):getOpenAIReply(message)),mode:'ai'}); }
      catch (err) { console.error('AI error:',err.message); return send(res,502,{error:'AI service unavailable. Demo mode still works in the browser.'}); }
    } catch { return send(res,400,{error:'Invalid JSON'}); }
  }
  if (req.method !== 'GET' || !allowedFiles.has(pathname)) return send(res,404,{error:'Not found'});
  const filePath = path.join(ROOT,pathname === '/'?'index.html':pathname.slice(1));
  try { return send(res,200,fs.readFileSync(filePath),mime[path.extname(filePath)]); }
  catch { return send(res,404,{error:'Not found'}); }
});
server.listen(PORT,()=>console.log(`Portfolio running at http://localhost:${PORT} | AI mode: ${PROVIDER}`));
