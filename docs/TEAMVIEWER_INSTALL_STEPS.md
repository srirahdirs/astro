# TeamViewer Installation — Step-by-Step for Client

Use this when you install the project on the client's PC via TeamViewer.

---

## Option 1: Give Only the .exe (Easiest — Recommended)

**You do this on YOUR PC first, then give the client the built .exe.**

### On your PC (before TeamViewer)
1. Build the app:
   ```powershell
   cd c:\xampp\htdocs\astro
   npm run electron:build:safe
   ```
2. Find the exe: `dist\win-unpacked\WeddingHoroscopeMatcher.exe` (or `dist-build\` if build script kept that name)
3. Zip the entire `win-unpacked` folder (or use the installer from `dist\` if created)
4. Send to client: Google Drive, WeTransfer, USB, etc.

### What client does (no TeamViewer needed)
1. Unzip the folder
2. Double-click `WeddingHoroscopeMatcher.exe`
3. Done. Login: **admin@example.com** / **admin123**

**No Node.js, no MySQL, no setup.** The app uses SQLite and stores data in `%LOCALAPPDATA%\wedding-horoscope\`.

---

## Option 2: Install Full Project on Client's PC via TeamViewer

Use this if the client needs the source code or you want to install from scratch on their machine.

### Before connecting
- [ ] Get project zip or ensure client has Git
- [ ] Have admin password ready (or use default admin123)

### Step 1: Install Node.js on client's PC
1. Download: https://nodejs.org (LTS version)
2. Run installer → Next → Accept → Install
3. Restart Command Prompt / PowerShell after install
4. Verify: `node -v` and `npm -v` should show versions

### Step 2: Copy project to client's PC
**Option A — Zip**
- Zip your project folder (exclude `node_modules`, `.next`, `dist`)
- Send zip to client (email, Drive, etc.)
- Client extracts to e.g. `C:\wedding-horoscope`

**Option B — Git**
- Client runs: `git clone https://github.com/srirahdirs/astro.git C:\wedding-horoscope`

### Step 3: Install dependencies
```powershell
cd C:\wedding-horoscope
npm install
```

### Step 4: Create .env file
Create `C:\wedding-horoscope\.env.local` with:

```env
NODE_ENV=production
DATABASE_TYPE=sqlite
SQLITE_PATH=C:\Users\CLIENT_USERNAME\AppData\Local\wedding-horoscope\data\horoscope.db
UPLOADS_DIR=C:\Users\CLIENT_USERNAME\AppData\Local\wedding-horoscope\uploads
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace `CLIENT_USERNAME` with the actual Windows username (e.g. from `echo %USERNAME%`).

**Or** leave `.env.local` empty — the Electron app sets these automatically when run.

### Step 5: Build the desktop app
```powershell
npm run electron:build:safe
```

Wait for build to finish (may take 2–5 minutes).

### Step 6: Create desktop shortcut
1. Go to: `C:\wedding-horoscope\dist\win-unpacked\` (or `dist-build\win-unpacked\`)
2. Right-click `WeddingHoroscopeMatcher.exe` → Send to → Desktop (create shortcut)
3. Rename shortcut to "Wedding Horoscope Matcher"

### Step 7: Test
1. Double-click the shortcut
2. App should open
3. Login: **admin@example.com** / **admin123**
4. Test: Upload a PDF, lookup, etc.

### Step 8: Give client the credentials
- **Email**: admin@example.com
- **Password**: admin123 (ask them to change after first login)

---

## Quick Checklist (Option 2)

| Step | Action |
|------|--------|
| 1 | Install Node.js |
| 2 | Copy project (zip or git clone) |
| 3 | `npm install` |
| 4 | (Optional) Create .env.local for SQLite path |
| 5 | `npm run electron:build:safe` |
| 6 | Create desktop shortcut from dist-build\win-unpacked\WeddingHoroscopeMatcher.exe |
| 7 | Test login and features |
| 8 | Hand over credentials |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `node` not found | Restart terminal after Node.js install; or add Node to PATH |
| Build fails (ERR_ELECTRON_BUILDER) | Close app, close File Explorer on dist folder, run `npm run electron:build:safe` |
| Blank screen on open | Check DevTools (F12) for errors; ensure port 3000 is free |
| "Database failed" | Ensure `docs/sqlite-schema.sql` exists; app auto-creates DB on first run |

---

## Summary: What to Give Client

| Delivery | What client gets |
|----------|------------------|
| **Easiest** | Zipped `win-unpacked` folder with WeddingHoroscopeMatcher.exe — just run it |
| **Installer** | `Wedding Horoscope Matcher Setup x.x.x.exe` from `dist\` — install like any app |
| **Full project** | Source code + instructions to build (Option 2 above) |
