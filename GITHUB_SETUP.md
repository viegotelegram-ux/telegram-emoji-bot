# Getting your bot from Claude → GitHub → live on Render

This assumes you've never used GitHub before. Two paths are given for the
GitHub upload step — pick **Option A** if you want to avoid the command
line entirely.

---

## Step 0: Get the project onto your computer

1. In the Claude chat, download the `telegram-emoji-bot` folder/files that
   were shared with you (click each file, or use the download option in the
   file panel) into a folder on your computer, e.g. `Documents/telegram-emoji-bot`.
2. Confirm it looks like this:
   ```
   telegram-emoji-bot/
     lib/
     miniapp/
     .env.example
     .gitignore
     package.json
     render.yaml
     server.js
     README.md
   ```

## Step 1: Create a GitHub account

1. Go to [github.com](https://github.com) → **Sign up** → follow the prompts
   (email, username, password). Verify your email if asked.

## Step 2: Create a new empty repository

1. Once logged in, click the **+** in the top-right corner → **New repository**.
2. Name it `telegram-emoji-bot` (or anything you like).
3. Leave it **Public** or set it **Private** — either works fine for this.
4. **Important:** do *not* tick "Add a README", "Add .gitignore", or "Add a
   license" — leave the repo completely empty. We already have those files
   locally and it's simpler not to merge two histories as a beginner.
5. Click **Create repository**. GitHub will show you a page with setup
   instructions and a URL like `https://github.com/yourname/telegram-emoji-bot.git`
   — keep this tab open, you'll need that URL in Step 4.

---

## Option A — GitHub Desktop (recommended if you're new to this)

1. Download and install [GitHub Desktop](https://desktop.github.com/).
2. Open it → sign in with the GitHub account from Step 1.
3. **File → Add Local Repository** → browse to your `telegram-emoji-bot`
   folder from Step 0.
4. It'll say "this directory is not a git repository" — click **create a
   repository** right there.
5. You'll see all your files listed as changes. Type a summary like
   `Initial commit` in the box bottom-left → click **Commit to main**.
6. Click **Publish repository** (top bar). Untick "Keep this code private"
   if you don't mind it being public → click **Publish**.
7. Done — refresh your GitHub repo page in the browser and your files
   should be there.

Skip to **Step 5** below.

---

## Option B — Command line (git)

1. Install Git:
   - **Mac:** open Terminal, type `git --version` — if it's not installed,
     macOS will prompt you to install the Xcode command line tools. Accept.
   - **Windows:** download and install [Git for Windows](https://git-scm.com/download/win),
     then open "Git Bash" from your Start menu for all commands below.
2. Open a terminal *inside* your project folder:
   - Mac: right-click the folder → "New Terminal at Folder" (or `cd` to it manually).
   - Windows (Git Bash): right-click the folder → "Git Bash Here".
3. Run these commands one at a time (press Enter after each, read any output):

   ```bash
   git init
   ```
   Sets up an empty repository in this folder.

   ```bash
   git add .
   ```
   Stages all files for commit — `.gitignore` makes sure `.env` and
   `node_modules` are skipped automatically.

   ```bash
   git commit -m "Initial commit"
   ```
   Saves a snapshot with that message.

   ```bash
   git branch -M main
   ```
   Names the branch `main` (GitHub's default).

   ```bash
   git remote add origin https://github.com/yourname/telegram-emoji-bot.git
   ```
   Replace the URL with the one from your actual repo page (Step 2.5).
   This tells your local folder where to push to.

   ```bash
   git push -u origin main
   ```
   Uploads everything. First time, GitHub will pop up a browser window
   asking you to sign in and authorize — approve it, then the push
   completes in the terminal.

4. Refresh your GitHub repo page in the browser — your files should be there.

---

## Step 5: Sanity check before deploying

On your repo page on GitHub, click into the file list and confirm:
- ✅ `server.js`, `package.json`, `lib/`, `miniapp/`, `render.yaml` are there.
- ✅ There's **no `.env` file** listed (if there is, stop — remove it, see
  note below).
- ✅ There's **no `node_modules` folder** listed.

> If you *do* see `.env` in the repo: your real bot token is now public.
> Go to BotFather → `/mybots` → your bot → **API Token** → **Revoke current
> token**, get a new one, delete `.env` from the repo, and re-check your
> `.gitignore` was actually in place before your first commit.

## Step 6: Deploy to Render

Now that the code is on GitHub, follow the "Deploying to Render" section in
the project's `README.md`:
1. Render → **New → Blueprint** → select your `telegram-emoji-bot` repo.
2. Set `BOT_TOKEN` and `PUBLIC_URL` env vars as described there.
3. Send `/start` to your bot in Telegram once it's deployed.

---

## Making changes later

Whenever you edit the code and want to update the live bot:

- **GitHub Desktop:** make your edits → open GitHub Desktop → you'll see
  the changed files → write a short commit message → **Commit to main** →
  **Push origin**. Render auto-redeploys on push.
- **Command line:** `git add .` → `git commit -m "describe your change"` →
  `git push`.
