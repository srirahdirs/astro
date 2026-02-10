# WhatsApp Token That Doesn’t Expire (System User)

The token from **Generate access token** on API Setup expires (often in 1 hour or 24 hours). To avoid “Session has expired” errors, use a **System User** token that can be set to **never expire**.

---

## Step 1: Open Business Settings

1. Go to **[business.facebook.com](https://business.facebook.com)**.
2. Use the **Meta Business Suite** account that owns your app (or switch to it).
3. Click the **☰** menu (top left) → **Business Settings** (or **Settings** → **Business settings**).

---

## Step 2: Create a System User

1. In the left menu go to **Users** → **System users** (under “People”).
2. Click **Add**.
3. Enter a name (e.g. **WhatsApp API**).
4. Role: **Admin**.
5. Click **Create system user**.

---

## Step 3: Assign Your App to the System User

1. Open the system user you just created.
2. Go to **Assign assets** (or **Add assets**).
3. Choose **Apps** → select your **Wedding Profile Matcher** (or your app name).
4. Set permission to **Full control**.
5. Save.

---

## Step 4: Generate a Token for the System User

1. In the same system user page, click **Generate new token**.
2. Select your **app** (e.g. Wedding Profile Matcher).
3. Choose **Custom permissions** and enable:
   - **whatsapp_business_messaging**
   - **whatsapp_business_management**
4. Token expiration: choose **Never** (or **60 days** if “Never” is not available; then repeat before 60 days).
5. Click **Generate token**.
6. **Copy the token** and store it safely. You won’t see it again.

---

## Step 5: Put the Token in Your App

1. Open your project **`.env`**.
2. Set:
   ```env
   WHATSAPP_ACCESS_TOKEN=the_token_you_just_copied
   ```
3. Keep **WHATSAPP_PHONE_NUMBER_ID** as it is (e.g. `977328588797849`).
4. Restart your app (`npm run dev`).

---

## If You Don’t See “System users”

- You need a **Meta Business Account**. If you only have a developer account and no Business Manager, create one at [business.facebook.com](https://business.facebook.com) and link your app to it.
- Your app must be linked to that business (e.g. in **App** → **Settings** → **Basic** → Business account).

---

## Summary

| Token from API Setup | System User token |
|----------------------|-------------------|
| Expires in 1–24 hours (or 60 days) | Can be set to **Never** (or 60 days) |
| Quick to get | One-time setup in Business Settings |
| Good for testing | Good for production / no “Session has expired” |

After this, you won’t need to regenerate the token unless you revoke it or change permissions.
