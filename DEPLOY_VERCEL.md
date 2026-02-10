# Deploy Wedding Horoscope Matcher to Vercel

This guide walks you through hosting this Next.js app on Vercel and connecting it to a cloud MySQL database and WhatsApp.

---

## 1. Prerequisites

- A **GitHub** account
- A **cloud MySQL** database (Vercel does not host MySQL). Options:
  - **[PlanetScale](https://planetscale.com)** – free tier, MySQL-compatible, works well with serverless
  - **[Railway](https://railway.app)** – add MySQL from the dashboard
  - **[Aiven](https://aiven.io)** – managed MySQL
  - Your own server with MySQL and a **public IP** (e.g. VPS)

---

## 2. Push your project to GitHub

If the project is not in a Git repo yet:

```bash
cd C:\xampp\htdocs\wedding-horoscope-matcher
git init
git add .
git commit -m "Initial commit"
```

Create a new repository on [github.com](https://github.com/new), then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/wedding-horoscope-matcher.git
git branch -M main
git push -u origin main
```

---

## 3. Set up cloud MySQL

1. Create a MySQL database with your chosen provider.
2. Run the schema: in phpMyAdmin (or your provider’s SQL console), create the database and run the contents of **`database/schema.sql`**.
3. Note the **host**, **port**, **user**, **password**, and **database name**.
4. (Optional) Create the admin user by running **`node scripts/seed-admin.js`** locally with the cloud DB credentials in `.env`, or insert the user manually in the cloud DB.

---

## 4. Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign in (e.g. with GitHub).
2. Click **Add New…** → **Project**.
3. **Import** the `wedding-horoscope-matcher` repository from GitHub.
4. Leave **Framework Preset** as Next.js and **Root Directory** as `.` (unless you use a subfolder).
5. Before deploying, open **Environment Variables** and add:

| Name | Value | Notes |
|------|--------|--------|
| `MYSQL_HOST` | your DB host | e.g. `aws.connect.psdb.cloud` (PlanetScale) |
| `MYSQL_PORT` | `3306` | or your provider’s port |
| `MYSQL_USER` | your DB user | |
| `MYSQL_PASSWORD` | your DB password | |
| `MYSQL_DATABASE` | `wedding_horoscope` | or your DB name |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Replace with your actual Vercel URL after first deploy |
| `WHATSAPP_ACCESS_TOKEN` | your Meta token | From WhatsApp API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | your phone number ID | From WhatsApp API Setup |

6. Click **Deploy**. Wait for the build to finish.
7. After the first deploy, set **`NEXT_PUBLIC_APP_URL`** to your real Vercel URL (e.g. `https://wedding-horoscope-matcher.vercel.app`) and redeploy if you had used a placeholder.

---

## 5. File uploads on Vercel

On Vercel, the serverless filesystem is **ephemeral** (uploads in `public/uploads` are not persistent across deployments). For production you may want to use external file storage (e.g. S3, Cloudinary) or accept that uploads are temporary unless you add your own storage integration.

---

## 6. SSL for MySQL (if required)

Some hosts (e.g. PlanetScale) require SSL for MySQL. If you get connection errors, you may need to enable SSL in the connection. That can require code changes in `lib/db.ts` (e.g. `ssl: { rejectUnauthorized: true }` or the host’s CA). Check your provider’s docs for Node.js/MySQL and SSL.

---

## 7. Custom domain (optional)

1. In the Vercel project, go to **Settings** → **Domains**.
2. Add your domain and follow the DNS instructions.
3. Update **`NEXT_PUBLIC_APP_URL`** to your custom domain and redeploy.

---

## 8. Summary checklist

- [ ] Code pushed to GitHub
- [ ] Cloud MySQL created and schema run
- [ ] Admin user created (seed script or manual)
- [ ] Vercel project created and env vars set (MySQL, `NEXT_PUBLIC_APP_URL`, WhatsApp)
- [ ] First deploy successful
- [ ] `NEXT_PUBLIC_APP_URL` set to final Vercel (or custom) URL
- [ ] Login and upload tested on the live URL

Your app will be live at `https://<your-project>.vercel.app`. Use the same admin email/password you set in the database to log in.
