# Client Handover — Wedding Horoscope Matcher

This document describes how to hand over the project to the client.

---

## 1. What to Deliver

### Option A: Web App (hosted on server)
- Deployed app URL (e.g. `https://astro.youngzen.in`)
- Admin login credentials
- Access to hosting/server (if client manages their own)

### Option B: Windows Desktop App (.exe)
- `Wedding Horoscope Matcher Setup x.x.x.exe` (installer)
- Or `WeddingHoroscopeMatcher.exe` (portable, from `dist-build/win-unpacked/`)

---

## 2. Pre-Handover Checklist

- [ ] **Database**: MySQL/SQLite set up and schema applied
- [ ] **Admin user**: Created with secure password
- [ ] **Environment**: `.env` configured (DB, app URL)
- [ ] **Uploads folder**: Writable, path correct in config
- [ ] **Test**: Upload horoscope, lookup, record share, follow-ups work
- [ ] **Build** (for desktop): `.exe` built and tested on clean Windows PC

---

## 3. Environment Configuration

Create `.env.local` (web) or ensure Electron uses correct env:

```env
# Database (MySQL)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=wedding_horoscope

# App URL (use production URL for web; localhost for Electron)
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Uploads (optional; defaults to public/uploads)
UPLOADS_DIR=/path/to/uploads
```

**Never commit** `.env`, `.env.local`, or `.env_prod` — they contain secrets.

---

## 4. Database Setup

1. Create database: `wedding_horoscope`
2. Run schema: `mysql -u root -p < database/schema.sql`
3. Seed admin: `node scripts/seed-admin.js`
4. Change default password after first login

---

## 5. Running the App

### Web (development)
```bash
npm install
npm run dev
```
Open http://localhost:3000

### Web (production)
```bash
npm install
npm run build
npm run start
```

### Desktop (Electron)
```bash
npm install
npm run electron:build:safe
```
Run: `dist-build/win-unpacked/WeddingHoroscopeMatcher.exe`

---

## 6. Client Credentials

Provide the client with:
- **Login URL**: e.g. `https://yourdomain.com` or open the .exe
- **Email**: admin@example.com (or custom)
- **Password**: Set via `ADMIN_PASSWORD=xxx node scripts/seed-admin.js`

**Advise client** to change the password after first login.

---

## 7. Key Features to Explain

1. **Lookup** — Enter registration ID (e.g. 40001) to see profile, horoscope shared to/received from
2. **Upload horoscope** — Select PDF, link to profile, enter WhatsApp numbers. After save, WhatsApp chats open; user attaches the PDF manually in each chat
3. **Record share** — Log when horoscope shared from one profile to another
4. **Follow-ups** — Add notes with due dates; due today shown on dashboard
5. **Registrations** — Manage profiles (add, edit)

---

## 8. Support / Maintenance

- **Backup**: Regular DB backups (MySQL dump or SQLite file)
- **Updates**: `git pull`, `npm install`, rebuild if needed
- **Logs**: Check server logs for errors
- **Uploads**: Ensure uploads folder has space and write permission

---

## 9. Files to Exclude from Handover

- `.env`, `.env.local`, `.env_prod` (secrets)
- `node_modules` (reinstall with `npm install`)
- `.next` (rebuilt with `npm run build`)
- `dist`, `dist-build` (rebuilt when needed)

---

## 10. Quick Reference

| Item | Location / Command |
|------|-------------------|
| Schema | `database/schema.sql` |
| Seed admin | `node scripts/seed-admin.js` |
| Build desktop | `npm run electron:build:safe` |
| Exe output | `dist-build/win-unpacked/WeddingHoroscopeMatcher.exe` |
| Data (Electron) | `%LOCALAPPDATA%\wedding-horoscope\data\` |
