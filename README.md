# Pushparaj — Cartoon Animated Python + AI Portfolio

A complete, responsive animated portfolio inspired by the **style and interactions** of the reference screen recording: floating pill navigation, orange accents, a cartoon developer with an animated wave, dark/light mode, skills, projects, contact form, and a Gemini-capable AI chatbot.

## 1) Run it on Mac / Windows

You need Node.js 18 or later.

```bash
node server.js
```

Open: http://localhost:3000

You can also open `portfolio-preview.html` directly in Chrome for a **demo-only offline preview**; it contains the page's CSS, JS and sample profile inline.

## 2) Make it your own

Edit `site-data.json` to update:

- `name`, `shortName`, `role`, `headline`, `intro`, `about`, `location`
- `email`, `github`, `linkedin`
- `skills`, `focusAreas` and `projects` (including `link` and `tags`)

**Important:** The included projects are labeled **SAMPLE PROJECT** and the skills are an editable example; replace them with work and tools you can accurately represent. The skill accent bars are decorative, **not numeric proficiency ratings**.

### Resume: View and Download

Place your own PDF in this exact folder as `resume.pdf` (next to `index.html` and `server.js`). The **RESUME ↗** button in the Contact section will then offer **View Resume** and **Download Resume**. Until the PDF exists, both options are disabled so they don't lead to a 404.

### Contact form

Set a real public `email` in `site-data.json` to enable **Compose Email**. This opens a visitor's email app with the message prefilled. It is **not** an email-sending service, and the website does not store submitted text.

## 3) Optional live Gemini chatbot

Do **not** put the API key in HTML, JS or `site-data.json`.

Copy the sample secrets file:

```bash
cp .env.example .env
```

Edit `.env`:

```ini
GEMINI_API_KEY=YOUR_NEW_PRIVATE_KEY
GEMINI_MODEL=gemini-2.5-flash
PORT=3000
```

Use a currently supported model ID that your Google AI Studio account can access. Never use a revoked key; do not share the key in chat or commit `.env`. When no key is set the assistant works in demo mode. The Node server handles Gemini requests server-side, with bounded retries for temporary overload errors.

Start or restart `node server.js`. Check `http://localhost:3000/api/status`, then send a message. A status of `provider: gemini` only confirms configuration, not whether the Google request will succeed.

## 4) Deploy to Render on a free Web Service

1. Create a **new GitHub branch or repository** for the new design. Do not replace your existing live site before backing it up.
2. Commit the project files, **not `.env`** (`.gitignore` already excludes it).
3. In Render: New → Web Service → connect that GitHub repository.
4. Runtime: **Node**. Build command: `npm install`. Start command: `node server.js`.
5. Add Render environment variables `GEMINI_API_KEY` and `GEMINI_MODEL` privately. Do **not** put `PORT=3000` in Render; let it supply the port.
6. Choose an available plan (Render's free tier may sleep when idle and has usage limits), deploy, and test the URL.
7. Verify your resume file, contact email, GitHub links and project data before sharing.

## 5) Safely replace an EXISTING Render/GitHub portfolio

Your existing GitHub repo may have newer customizations. **Don't upload this ZIP directly over it** without a backup.

One safe workflow:

```bash
# In your CURRENT repo, with a clean working tree:
git pull --rebase origin main
git switch -c cartoon-redesign
```

Copy the new `index.html`, `styles.css`, `app.js` and any server changes you actually want into that branch. Review/merge your real `site-data.json`, `resume.pdf`, and custom assets from the previous portfolio, then test locally. Push the branch and preview/deploy it before merging to `main`. Keep `.env` local and private.

Or deploy this **new ZIP as a separate Render service** first, without touching the existing one.

## Notes

- All character illustration and motion are inline SVG + CSS; no video or 3D engine needed.
- The original screen recording is **not included** in this package.
- Dark/light theme preference saves in the browser.
- Animations respect `prefers-reduced-motion`.
- The chatbot does not invent the owner's verified experience; customize `site-data.json` carefully.
- Demo HTML does not make live Gemini calls or provide a working resume unless run on the server with the PDF.
# pushparaj-portfolio
