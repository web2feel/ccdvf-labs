# CCDV-F Labs

Hands-on TypeScript labs for the **CCDV-F study plan** (Claude Certified Developer – Foundations).
Each lesson on the study site has a lab. The code for every lab is in the [`labs`](labs) folder.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/web2feel/ccdvf-labs)

You need a **Claude API key**. Create one in the [Claude Console](https://platform.claude.com) under **API Keys**.
The labs use Claude Haiku 4.5, the cheapest current model, so each lab costs much less than one cent.

## Option A: in your browser (no install)

1. Click **Open in GitHub Codespaces** above, then **Create codespace**.
   If you see a box for `ANTHROPIC_API_KEY`, paste your key there. It is saved as a private Codespaces secret.
2. Wait until the editor opens and `npm install` has finished in the terminal.
3. If you did **not** add the key in step 1, create a file named `.env` with this line:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Run a lab in the terminal:
   ```bash
   npm run lab labs/week-1/day-1/01-first-call.ts
   ```

Personal GitHub accounts include free Codespaces hours every month. A codespace stops by itself after about
30 minutes without use. To save your free hours, stop it when you finish (**Codespaces** menu → **Stop current codespace**).

## Option B: on your computer

You need **Node.js 22.9 or newer** (`node -v`).

```bash
git clone https://github.com/web2feel/ccdvf-labs.git
cd ccdvf-labs
npm install
cp .env.example .env        # then put your API key in .env
npm run lab labs/week-1/day-1/01-first-call.ts
```

To get new labs when they are added, run `git pull`.

## Rules

- **Never** commit your API key. `.env` is already in `.gitignore`.
- Each lab file starts with a comment that says what it does and how to run it.
- Change the code and run it again. That is how you learn!
