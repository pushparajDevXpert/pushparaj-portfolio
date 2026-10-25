/* Creative animated portfolio. Edit content in site-data.json. No secrets in this file. */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const clean = x => String(x ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeURL = value => { try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; } };
let profile = {};
let aiReady = false;
let assistantMode = 'demo';
let chatBusy = false;
let lastFocus = null;
let resumeAvailable = false;
let typingTimer = null;
const defaults = {
  name: 'Pushparaj Abhijeet Supekar', shortName: 'Pushparaj', role: 'Full-Stack Python Developer · AI / Data Science',
  headline: 'I connect Python backends, modern web experiences, and data-driven intelligence to build useful digital products.',
  intro: 'I build web experiences with Python and explore intelligent applications.',
  about: 'I enjoy connecting modern frontend design, backend logic, and the power of data.',
  location: 'India', email: '', github: 'https://github.com/pushparajDevXpert', linkedin: '', skills: [], focusAreas: [], projects: []
};
const icons = { 'Python': '🐍', 'FastAPI': '⚡', 'Django': 'D', 'React': '⚛', 'JavaScript': 'JS', 'Pandas': '▥', 'SQL': '▤', 'PostgreSQL': '▣', 'Machine Learning': '✧', 'Docker': '◈', 'NumPy': '∑', 'LLM Apps': '✳', 'RAG': '⌘', 'HTML / CSS': '</>', 'Git / GitHub': '⌁', 'scikit-learn': '◎', 'Data Visualization': '▥', 'Streamlit': 'S' };
const skillList = ['Python', 'FastAPI', 'Django', 'React', 'SQL', 'Pandas', 'Machine Learning', 'Docker'];
const skillCats = ['Backend', 'API', 'Backend', 'Frontend', 'Database', 'Data', 'AI / ML', 'DevOps'];
const themes = ['purple', 'orange', 'blue', 'green'];
function projectActions(project) {
  const liveURL = safeURL(project.liveUrl || project.link);
  const githubURL = safeURL(project.githubUrl);

  if (!liveURL && !githubURL) {
    return '<span class="project-link is-placeholder">Concept only</span>';
  }

  return `
        <div class="project-actions">

            ${liveURL ? `
                <a href="${clean(liveURL)}"
                   class="project-btn live"
                   target="_blank"
                   rel="noopener noreferrer">
                    ↗ Live Demo
                </a>
            ` : ''}

            ${githubURL ? `
                <a href="${clean(githubURL)}"
                   class="project-btn github"
                   target="_blank"
                   rel="noopener noreferrer">
                    GitHub Code ↗
                </a>
            ` : ''}

        </div>
    `;
}
function applyProfile(data) {
  profile = { ...defaults, ...data };
  const first = profile.shortName || profile.name.split(' ')[0];
  $('#hero-first-name').textContent = `${first}.`;
  $('#hero-description').textContent = profile.headline;
  $('#about-intro').textContent = profile.intro;
  $('#about-body').textContent = profile.about;
  $('#year').textContent = new Date().getFullYear();
  document.title = `${first} | Animated Python & AI Portfolio`;
  $('meta[name="description"]').setAttribute('content', `${profile.name} — ${profile.role}. Animated full-stack Python and AI portfolio.`);
  const github = safeURL(profile.github);
  if (github) { $('#hero-github').href = github; $('#contact-github').href = github; $('#github-all').href = github; }
  const linkedin = safeURL(profile.linkedin);

  if (linkedin) {
    for (const id of ['#hero-linkedin', '#contact-linkedin']) { $(id).href = linkedin; $(id).target = '_blank'; $(id).rel = 'noopener noreferrer'; }
  } else {
    $('#hero-linkedin').title = 'Add LinkedIn URL in site-data.json';
    $('#contact-linkedin').title = 'Add LinkedIn URL in site-data.json';
    $('#hero-linkedin').setAttribute('aria-disabled', 'true');
    $('#contact-linkedin').setAttribute('aria-disabled', 'true');
    $('#hero-linkedin').addEventListener('click', e => e.preventDefault());
    $('#contact-linkedin').addEventListener('click', e => e.preventDefault());
  }

  const availableSkills = [...new Set((profile.skills || []).map(s => String(s)))];
  const skills = [...new Set(profile.skills || [])];
  for (const s of availableSkills) if (skills.length < 8 && !skills.includes(s)) skills.push(s);
  $('#skills-grid').innerHTML = skills.map((skill, i) => `<article class="skill-card reveal"><div class="skill-row"><span class="skill-icon" aria-hidden="true">${clean(icons[skill] || '⌘')}</span><span class="skill-category">${clean(skillCats[i] || 'Development')}</span></div><h3>${clean(skill)}</h3><div class="skill-track" aria-hidden="true"><span style="--bar-width:100%"></span></div></article>`).join('');
  const projects = (profile.projects || []).slice(0, 8);
  $('#project-grid').innerHTML = projects.map((p, i) => {
    const theme = themes[i % themes.length], symbol = ['✳', '</>', '▥', 'AI'][i % 4];
    const realURL = safeURL(p.link);
    const label = /sample/i.test(p.category || '') ? 'SAMPLE CONCEPT' : 'PROJECT';
    return `<article class="project-card reveal"><div class="project-thumbnail ${theme}">
    <div class="project-screen"><div class="project-screen-top"><i></i><i></i><i></i></div><div class="project-screen-inner"><div class="project-screen-side"><span></span><span></span><span></span><span></span></div><div class="project-screen-main"><div class="project-screen-heading"></div><div class="project-screen-panels"><b>${clean(symbol)}</b><b>↗</b></div><div class="project-screen-footer"></div></div></div></div><span class="project-floating-icon">${clean(symbol)}</span></div><div class="project-content"><h3>${clean(p.title)}</h3><p>${clean(p.description)}</p><div class="project-tags">${(p.tags || []).slice(0, 5).map(t => `<span>${clean(t)}</span>`).join('')}</div>
    <div class="project-bottom"><span class="project-type"></span>${projectActions(p)}</div></div></article>`;
  }).join('');
  runReveals();
  typeRoles(first);
}
function typeRoles(first) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { $('#typing-role').textContent = 'Full-Stack Python Developer'; return; }
  const roles = ['Full-Stack Python Developer', 'AI & Data Science Explorer', 'Building ideas into products'];
  let role = 0, pos = 0, deleting = false;

  const tick = () => {
    const word = roles[role]; $('#typing-role').textContent = word.slice(0, pos);
    if (!deleting) { pos++; if (pos > word.length) { deleting = true; typingTimer = setTimeout(tick, 1700); return; } }
    else { pos--; if (pos < 0) { deleting = false; role = (role + 1) % roles.length; pos = 0; } }
    typingTimer = setTimeout(tick, deleting ? 45 : 70);
  };
  clearTimeout(typingTimer); tick();
}
function runReveals() {
  const nodes = $$('.reveal,.rise');
  if (!('IntersectionObserver' in window)) return nodes.forEach(n => n.classList.add('visible'));
  const observer = new IntersectionObserver(entries => { for (const e of entries) if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); } }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
  nodes.forEach(n => observer.observe(n));
}
function setTheme(theme) {
  document.body.dataset.theme = theme;
  $('#theme-toggle').setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
  try { localStorage.setItem('portfolio-theme', theme); } catch { }
}
function initTheme() {
  let theme = 'dark';
  try { theme = localStorage.getItem('portfolio-theme') === 'light' ? 'light' : 'dark'; } catch { }
  setTheme(theme);
  $('#theme-toggle').addEventListener('click', () => setTheme(document.body.dataset.theme === 'dark' ? 'light' : 'dark'));
}
function initNavigation() {
  const menu = $('#menu-toggle'), links = $('#nav-links');
  menu.addEventListener('click', () => { const open = links.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); });
  $$('.nav-link').forEach(link => link.addEventListener('click', () => { links.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); }));
  const targets = $$('main section[id]');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); } }), { rootMargin: '-25% 0px -64% 0px' });
    targets.forEach(t => obs.observe(t));
  }
  window.addEventListener('scroll', () => { const h = document.documentElement; $('#site-progress').style.width = `${h.scrollHeight > innerHeight ? 100 * scrollY / (h.scrollHeight - innerHeight) : 0}%`; }, { passive: true });
}
function initCharacter() {
  const visual = $('.hero-visual'); const wave = $('#wave-button'); const speech = $('#hero-speech');
  const phrases = ['Glad you stopped by! ✨', 'Python + creativity = magic! ✳', 'Let’s make ideas real! 🚀', 'Code. Create. Repeat. ✦'];
  let i = 0;
  wave.addEventListener('click', () => { visual.classList.remove('waving'); void visual.offsetWidth; visual.classList.add('waving'); i = (i + 1) % phrases.length; speech.textContent = phrases[i]; setTimeout(() => visual.classList.remove('waving'), 1400); });
  if (matchMedia('(pointer:fine)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    visual.addEventListener('pointermove', e => { const r = visual.getBoundingClientRect(); const x = (e.clientX - (r.left + r.width / 2)) / r.width; const y = (e.clientY - (r.top + r.height / 2)) / r.height; visual.style.setProperty('--look-x', `${x * 2}px`); visual.style.setProperty('--look-y', `${y * 2}px`); });
    visual.addEventListener('pointerleave', () => { visual.style.setProperty('--look-x', '0px'); visual.style.setProperty('--look-y', '0px'); });
  }
  $('#hero-resume-btn').addEventListener('click', () => { document.querySelector('#contact').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => $('#resume-menu-toggle').click(), 650); });
}
// function initResume() {
//   const menu = $('#resume-menu-toggle'), pop = $('#resume-popup');
//   menu.addEventListener('click', () => { pop.hidden = !pop.hidden; menu.setAttribute('aria-expanded', String(!pop.hidden)); });
//   document.addEventListener('click', e => { if (!e.target.closest('.resume-selector')) { pop.hidden = true; menu.setAttribute('aria-expanded', 'false'); } });
//   fetch('/api/resume-status').then(r => r.ok ? r.json() : Promise.reject()).then(data => { resumeAvailable = !!data.available; updateResume(); }).catch(() => {
//     // Standalone preview: View/Download will work if a resume.pdf is placed next to the HTML.
//     resumeAvailable = false; updateResume();
//   });
// }
// Resume View & Download Fix

// Resume View & Download Fix

function initResume() {
  const menu = document.getElementById("resume-menu-toggle");
  const popup = document.getElementById("resume-popup");

  const view = document.getElementById("resume-view");
  const download = document.getElementById("resume-download");

  // Resume PDF paths
  view.href = "/resume.pdf";
  view.target = "_blank";
  view.rel = "noopener noreferrer";

  download.href = "/resume.pdf";
  download.setAttribute(
    "download",
    "Pushparaj_Supekar_Resume.pdf"
  );

  // Toggle resume dropdown
  menu.addEventListener("click", () => {
    popup.hidden = !popup.hidden;

    menu.setAttribute(
      "aria-expanded",
      String(!popup.hidden)
    );
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".resume-selector")) {
      popup.hidden = true;
      menu.setAttribute("aria-expanded", "false");
    }
  });

  // Check if resume PDF exists
  fetch("/api/resume-status", {
    cache: "no-store"
  })
    .then(response => {
      if (!response.ok) {
        throw new Error("Resume status failed");
      }
      return response.json();
    })
    .then(data => {
      resumeAvailable = data.available === true;
      updateResume();
    })
    .catch(error => {
      console.error("Resume error:", error);
      resumeAvailable = false;
      updateResume();
    });
}
// function updateResume() {
//   for (const id of ['#resume-view', '#resume-download']) {
//     $(id).setAttribute('aria-disabled', resumeAvailable ? 'false' : 'true');
//     if (!resumeAvailable) $(id).addEventListener('click', e => e.preventDefault());
//   }
//   $('#resume-unavailable').hidden = resumeAvailable;
// }
// function initContact() {
//   $('#contact-form').addEventListener('submit', e => {
//     e.preventDefault();
//     const email = profile.email;
//     if (!email || email === 'your.email@example.com' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
//       $('#form-note').textContent = 'To activate this form, add your public contact email to site-data.json. Until then, visitors can reach you via the GitHub link.';
//       $('#form-note').style.color = 'var(--accent)'; return;
//     }
//     const data = new FormData(e.currentTarget);
//     const name = [data.get('first'), data.get('last')].filter(Boolean).join(' ');
//     const subject = encodeURIComponent(`Portfolio inquiry from ${name}`);
//     const body = encodeURIComponent(`From: ${name}\nEmail: ${data.get('email')}\n\n${data.get('message')}`);
//     window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
//     $('#form-note').textContent = 'Your email app should open with the message ready to send.';
//   });
// }
// Enable / Disable Resume Links

// Enable / Disable Resume Links

function updateResume() {
  const links = [
    document.getElementById("resume-view"),
    document.getElementById("resume-download")
  ];

  links.forEach(link => {

    if (resumeAvailable) {

      // Enable resume links
      link.removeAttribute("aria-disabled");
      link.removeAttribute("tabindex");

      link.style.pointerEvents = "auto";
      link.style.opacity = "1";
      link.style.cursor = "pointer";

    } else {

      // Disable links when PDF is missing
      link.setAttribute("aria-disabled", "true");
      link.setAttribute("tabindex", "-1");

      link.style.pointerEvents = "none";
      link.style.opacity = "0.4";
      link.style.cursor = "not-allowed";
    }
  });

  const unavailable = document.getElementById(
    "resume-unavailable"
  );

  if (unavailable) {
    unavailable.hidden = resumeAvailable;
  }
}
function initContact() {
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-note");
  const button = form.querySelector('button[type="submit"]');

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (button.disabled) return;

    const originalText = button.innerHTML;
    const formData = new FormData(form);

    const fullName = [
      formData.get("first"),
      formData.get("last")
    ].filter(Boolean).join(" ");

    formData.append(
      "_subject",
      `Portfolio inquiry from ${fullName}`
    );

    button.disabled = true;
    button.textContent = "Sending...";
    status.textContent = "Submitting your message...";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Message submission failed");
      }

      status.textContent =
        "✅ Message submitted successfully! Thank you.";

      form.reset();

    } catch (error) {
      status.textContent =
        "❌ Unable to send your message. Please try again.";

      console.error("Contact form error:", error);

    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
    }
  });
}
function demoReply(question) {
  const q = question.toLowerCase();
  if (/project|work|built|portfolio/.test(q)) return `The portfolio currently shows: ${(profile.projects || []).map(p => p.title).join(', ')}. These are editable sample projects, not verified finished work.`;
  if (/skill|tech|python|api|stack|django|fastapi|react|data|ai|machine learning/.test(q)) return `The portfolio lists these example technologies: ${(profile.skills || []).join(', ')}. Check with Pushparaj to confirm specific experience.`;
  if (/contact|email|linkedin|github|resume|hire/.test(q)) return `GitHub: ${profile.github || 'not configured'}. ${profile.email && profile.email !== 'your.email@example.com' ? `Email: ${profile.email}.` : 'A public email has not been configured yet.'}`;
  return `Hello! I can help you explore ${profile.shortName}'s portfolio, sample projects, Python focus, and contact information. Live AI requires a server-side Gemini key.`;
}
function appendChat(text, who, pending = false) {
  const node = document.createElement('div'); node.className = `chat-msg ${who}${pending ? ' pending' : ''}`;
  if (who === 'bot') { const icon = document.createElement('div'); icon.className = 'msg-avatar'; icon.textContent = '✳'; node.appendChild(icon); }
  const p = document.createElement('p'); p.textContent = text; node.appendChild(p);
  $('#chat-messages').appendChild(node); $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight;
  return node;
}
function openChat() {
  lastFocus = document.activeElement; document.body.classList.add('chat-open'); $('#chat-scrim').hidden = false; $('#chat-panel').classList.add('open'); $('#chat-panel').setAttribute('aria-hidden', 'false'); $('#chat-panel').inert = false; $('#floating-chat').setAttribute('aria-expanded', 'true'); $('#chat-input').focus();
}
function closeChat() {
  document.body.classList.remove('chat-open'); $('#chat-scrim').hidden = true; $('#chat-panel').classList.remove('open'); $('#chat-panel').setAttribute('aria-hidden', 'true'); $('#chat-panel').inert = true; $('#floating-chat').setAttribute('aria-expanded', 'false'); if (lastFocus?.focus) lastFocus.focus();

}
function isResumeRequest(question) {
  return /\b(resume|r[eé]sum[eé]|cv|curriculum vitae|bio[ -]?data)\b/i.test(question);
}
async function replyWithResumeLinks(pending) {
  let available = false;

  try {
    const response = await fetch('/api/resume-status', {
      cache: 'no-store'
    });

    if (response.ok) {
      available = Boolean((await response.json()).available);
    }
  } catch (error) {
    console.error("Resume status error:", error);
  }

  const bubble = pending.querySelector('p');

  if (!available) {
    bubble.textContent =
      "Pushparaj's resume is currently unavailable.";
    return;
  }

  bubble.textContent =
    "Sure! You can view Pushparaj's resume or download a PDF copy:";

  const actions = document.createElement('div');
  actions.className = 'resume-chat-actions';

  // View Resume
  const view = document.createElement('a');
  view.href = '/resume.pdf';
  view.target = '_blank';
  view.rel = 'noopener noreferrer';
  view.innerHTML = `
    <i class="fa-solid fa-eye" aria-hidden="true"></i>
    <span>View Resume</span>
  `;

  // Download Resume
  const download = document.createElement('a');
  download.href = '/resume.pdf';
  download.download = 'Pushparaj_Supekar_Resume.pdf';
  download.innerHTML = `
    <i class="fa-solid fa-download" aria-hidden="true"></i>
    <span>Download Resume</span>
  `;

  actions.append(view, download);

  const content = document.createElement('div');
  content.className = 'resume-chat-content';

  bubble.replaceWith(content);
  content.append(bubble, actions);
}
// async function askAI(question) {
//   question = question.trim(); if (!question || chatBusy) return;
//   appendChat(question, 'user'); $('#chat-input').value = ''; chatBusy = true; $('#chat-send').disabled = true;
//   const pending = appendChat('Thinking ···', 'bot', true);
//   try {
//     const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 39000);
//     try {
//       const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question }), signal: controller.signal });
//       if (!r.ok) { const body = await r.json().catch(() => ({})); throw Error(body.error || `AI service returned ${r.status}`); }
//       const data = await r.json(); pending.querySelector('p').textContent = data.reply || 'No response was returned.';
//     } finally { clearTimeout(timeout); }
//   } catch (err) {
//     pending.querySelector('p').textContent = aiReady ? 'The live AI is temporarily unavailable. Please try again shortly. You can still explore the projects and skills on this page.' : demoReply(question);
//   }
//   pending.classList.remove('pending'); $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight; chatBusy = false; $('#chat-send').disabled = false; $('#chat-input').focus();
// }
function isContactQuestion(question) {
  return /\b(contact|email|gmail|linkedin|reach|connect|hire)\b/i.test(question);
}

function showContactLinks(pending) {
  const bubble = pending.querySelector("p");

  bubble.textContent =
    "You can reach out to Pushparaj via email or connect with him on LinkedIn. Feel free to send a message regarding developer and AI opportunities!";

  const actions = document.createElement("div");
  actions.className = "resume-chat-actions";

  const email = document.createElement("a");
  email.href = `mailto:${profile.email}`;
  email.textContent = "✉ Email Pushparaj";

  const linkedin = document.createElement("a");
  linkedin.href = safeURL(profile.linkedin);
  linkedin.target = "_blank";
  linkedin.rel = "noopener noreferrer";
  linkedin.textContent = "↗ LinkedIn Profile";

  actions.append(email, linkedin);

  const content = document.createElement("div");
  content.className = "resume-chat-content";

  bubble.replaceWith(content);
  content.append(bubble, actions);
}
async function askAI(question) {
  question = question.trim(); if (!question || chatBusy) return;
  appendChat(question, 'user'); $('#chat-input').value = ''; chatBusy = true; $('#chat-send').disabled = true;
  const pending = appendChat('Thinking ···', 'bot', true);
  try {
    if (isResumeRequest(question)) {
      await replyWithResumeLinks(pending);
    } else {
      const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 39000);
      try {
        const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question }), signal: controller.signal });
        if (!r.ok) { const body = await r.json().catch(() => ({})); throw Error(body.error || `AI service returned ${r.status}`); }
        const data = await r.json(); pending.querySelector('p').textContent = data.reply || 'No response was returned.';
      } finally { clearTimeout(timeout); }
    }
  } catch (err) {
    pending.querySelector('p').textContent = aiReady ? 'The live AI is temporarily unavailable. Please try again shortly. You can still explore the projects and skills on this page.' : demoReply(question);
  }
  pending.classList.remove('pending'); $('#chat-messages').scrollTop = $('#chat-messages').scrollHeight; chatBusy = false; $('#chat-send').disabled = false; $('#chat-input').focus();
}
// async function initAI() {
//   try { const r = await fetch('/api/status'); const s = await r.json(); aiReady = s.mode === 'ai'; assistantMode = s.provider || 'demo'; } catch { aiReady = false; assistantMode = 'demo'; }
//   $('#assistant-status').textContent = aiReady ? `Live assistant (${assistantMode})` : 'Demo assistant online';
//   $('#chat-disclaimer').textContent = aiReady ? 'Live AI may be temporarily unavailable or make mistakes. Verify important facts.' : 'Demo mode. Add a private GEMINI_API_KEY to enable live responses.';
//   $('#floating-chat').addEventListener('click', openChat); $('#open-assistant-section').addEventListener('click', openChat);
//   $('#chat-close').addEventListener('click', closeChat); $('#chat-scrim').addEventListener('click', closeChat);
//   document.addEventListener('keydown', e => {
//     if (e.key === 'Escape' && $('#chat-panel').classList.contains('open')) closeChat();
//     if (e.key === 'Tab' && $('#chat-panel').classList.contains('open')) {
//       const focusables = $$('#chat-panel button:not(:disabled),#chat-panel input'); const first = focusables[0], last = focusables.at(-1);
//       if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
//       else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
//     }
//   });
//   $('#chat-form').addEventListener('submit', e => { e.preventDefault(); askAI($('#chat-input').value); });
//   $$('.chat-suggestions [data-question]').forEach(b => b.addEventListener('click', () => askAI(b.dataset.question)));
// }
async function initAI() {
  try { const r = await fetch('/api/status'); const s = await r.json(); aiReady = s.mode === 'ai'; assistantMode = s.provider || 'demo'; } catch { aiReady = false; assistantMode = 'demo'; }
  $('#assistant-status').textContent = aiReady ? `Live assistant (${assistantMode})` : 'Demo assistant online';

  $('#chat-disclaimer').textContent = aiReady ? 'Live AI may be temporarily unavailable or make mistakes. Verify important facts.' : 'Demo mode. Add a private GEMINI_API_KEY to enable live responses.';

  // Open AI chatbot
  $('#floating-chat')?.addEventListener('click', openChat);

  $('#open-assistant-section')?.addEventListener('click', openChat);

  // Close AI chatbot
  $('#chat-close')?.addEventListener('click', closeChat);

  $('#chat-scrim')?.addEventListener('click', closeChat);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && $('#chat-panel').classList.contains('open')) closeChat();
    if (e.key === 'Tab' && $('#chat-panel').classList.contains('open')) {
      const focusables = $$('#chat-panel button:not(:disabled),#chat-panel input'); const first = focusables[0], last = focusables.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  $('#chat-form').addEventListener('submit', e => { e.preventDefault(); askAI($('#chat-input').value); });
  $$('.chat-suggestions [data-question]').forEach(b => b.addEventListener('click', () => askAI(b.dataset.question)));
}
async function boot() {
  initTheme(); initNavigation(); initCharacter(); initResume(); initContact();
  try { if (window.__EMBEDDED_PROFILE) { applyProfile(window.__EMBEDDED_PROFILE); } else { const r = await fetch('site-data.json'); if (!r.ok) throw Error('Profile missing'); applyProfile(await r.json()); } } catch { applyProfile(defaults); }
  await initAI();
}
boot();
