# Wedding Horoscope Matcher

Track horoscope sharing and follow-ups by **registration ID** (e.g. 40001). Built with Next.js 14 (App Router) and MySQL.

## Features

- **Lookup by registration ID**: See “shared to” (this profile’s horoscope shared to which IDs) and “received from” (we got horoscope from which IDs).
- **Record share**: Admin records when a horoscope is shared from one profile to another (e.g. groom 40001 → bride 40002).
- **Follow-ups**: Add follow-up notes with a due date (e.g. “Get back after 5 days”). **Follow-ups due today** are shown on the dashboard when the user logs in.
- **Upload horoscope**: Admin uploads a file, optionally links to a registration and enters WhatsApp number. File is saved in DB; you get a **WhatsApp share link** that opens WhatsApp with the file link pre-filled (one-click share).

## Setup

### 1. Database

- Create MySQL database and run the schema:

```bash
# From project root; adjust user/password if needed
mysql -u root -p < database/schema.sql
```

Or in phpMyAdmin: create database `wedding_horoscope`, then run the contents of `database/schema.sql`.

### 2. Environment

Copy `.env.example` to `.env.local` and set your MySQL credentials and app URL:

```env
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=wedding_horoscope
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Create admin user

From project root (after `npm install`):

```bash
node scripts/seed-admin.js
```

Default login: **admin@example.com** / **admin123**. Change the password after first login (e.g. by updating the DB or adding a “change password” feature).

To set a different password:

```bash
ADMIN_PASSWORD=YourSecurePassword node scripts/seed-admin.js
```

(Requires `dotenv` in the project; if not installed, create the user manually in MySQL with a bcrypt hash of your password.)

### 4. Run the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), log in, then use Dashboard, Lookup, Registrations, Record share, Follow-ups, and Upload Horoscope.

## WhatsApp automatic messaging

**Full setup from beginning:** See **[docs/WHATSAPP-SETUP-GUIDE.md](docs/WHATSAPP-SETUP-GUIDE.md)** for step-by-step instructions (Meta account, create app, get token, add numbers, test, go to production).

- **Automatic send**: If you set `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` in `.env.local`, the app sends the horoscope **automatically** to the WhatsApp number you enter (no click). Get these from [Meta for Developers](https://developers.facebook.com/) → Your App → WhatsApp → API Setup.
- **Fallback**: If the API is not configured, you get a **WhatsApp share link**; opening it pre-fills the message and you tap Send.
- **Important**: For automatic send, `NEXT_PUBLIC_APP_URL` must be a **public URL** (e.g. `https://yourdomain.com`) so WhatsApp’s servers can fetch the file. localhost won’t work for auto-send.

## Project structure

- `app/` – Next.js App Router (pages, layout, API routes)
- `lib/` – DB pool, auth helpers, queries
- `components/` – Reusable UI (e.g. LogoutButton)
- `database/schema.sql` – MySQL schema
- `scripts/seed-admin.js` – Create default admin user
