# Contributing to Mapfolio 🧭

Thank you for your interest in contributing to **Mapfolio**! We welcome contributions from developers, designers, cartographers, and GIS enthusiasts of all skill levels.

---

## 🌟 Code of Conduct

Please review and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all project interactions.

---

## 🛠️ Development Setup

### 1. Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`
- **Git**

### 2. Fork and Clone
```bash
git clone https://github.com/<your-username>/mapfolio.git
cd mapfolio
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 🌿 Branching Strategy

- `main` is our production and stable branch.
- Create feature or fix branches from `main`:
  - `feature/add-new-poster-preset`
  - `fix/gpx-parser-coordinates`
  - `docs/update-architecture`

---

## 🧪 Testing & Validation

Before submitting a Pull Request, ensure that:

```bash
# 1. Verify TypeScript types compile cleanly
npx tsc --noEmit

# 2. Verify production bundle builds without errors
npm run build
```

---

## 🚀 Submitting a Pull Request

1. **Keep PRs focused**: One feature or bugfix per PR.
2. **Clear descriptions**: Explain *what* changes were made and *why*.
3. **Screenshots / Recordings**: If UI changes were made, attach before/after screenshots.
4. **Follow conventions**: Keep TypeScript strictly typed and use Tailwind utility tokens.

Thank you for helping build Mapfolio! ❤️
