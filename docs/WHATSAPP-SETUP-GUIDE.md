# WhatsApp Automatic Message – Setup Guide (From Beginning)

This guide helps you set up **automatic** sending of files to WhatsApp (no click needed). You will create a Meta app, add WhatsApp, get an access token and phone number ID, then add them to this project.

---

## What You Need Before Starting

- A **Facebook account** (or Meta account)
- A **phone number** that is **not** used on WhatsApp or WhatsApp Business app (needed for the business number later; test number is provided by Meta)
- About **15–20 minutes**

---

## Step 1: Create a Meta Developer Account

1. Go to **[developers.facebook.com](https://developers.facebook.com)**.
2. Click **Get Started** (or **Log in** if you already have an account).
3. Log in with your Facebook/Meta account.
4. If asked, complete **developer registration** (name, email, accept terms). Click **Submit**.

---

## Step 2: Create an App

1. On the Meta for Developers page, click **My Apps** (top right).
2. Click **Create App**.
3. Choose **Other** (or **Business** if you see it) as the use case. Click **Next**.
4. Select **Business** as the app type. Click **Next**.
5. Enter:
   - **App name:** e.g. `Wedding Profile Matcher`
   - **App contact email:** your email
6. Click **Create app**. Your app is created.

---

## Step 3: Add WhatsApp to Your App

1. On your app’s dashboard, find **Add products to your app** or the **Products** section.
2. Find **WhatsApp** and click **Set up** (or **Add**).
3. You will see the **WhatsApp** section in the left menu. Click **WhatsApp** → **API Setup** (or **Getting started**).

---

## Step 4: Get Your Access Token and Phone Number ID

On the **API Setup** (or **Getting started**) page you will see:

### 4a) Access token

- At the top there is a long text (the **access token**).
- Click **Copy** to copy it.
- **Save it somewhere safe** (you will add it to the project in Step 7).
- Note: This token can **expire** (e.g. in 1–24 hours for a temporary token). For a lasting token you use a **System User** (optional, see Step 8).

### 4b) Phone number ID

- Under **Step 1: Select phone numbers** you see a **From** dropdown.
- It will show something like **Test number: +1 555 145 3450**.
- Below it you will see **Phone number ID:** and a number like `977328588797849`.
- Click the **copy** icon next to that **Phone number ID** and save it (you will add it in Step 7).

You now have:

- **Access token** (long string)
- **Phone number ID** (numeric, e.g. `977328588797849`)

---

## Step 5: Add a Recipient (Who Can Receive Messages)

In **development/test mode**, WhatsApp only allows sending to numbers you add:

1. On the same **API Setup** page, find **Step 1: Select phone numbers**.
2. Under **To**, look for **Add phone number** or **Manage phone number list**.
3. Add the **recipient’s phone number** with country code (e.g. India `91` + 10 digits, no + or spaces: `919876543210`).
4. Meta will send a **verification code** to that number; enter it to confirm.
5. You can add **up to 5 numbers** for testing.

Until you **go to production** (Step 9), you can send only to these added numbers.

---

## Step 6: Make Sure Your Project Can Be Reached by WhatsApp (For Sending Files)

When you send a **file**, the API sends it by **link**. WhatsApp’s servers must be able to open that link.

- **On your computer (localhost):** They cannot open `http://localhost:...`, so **automatic file send will not work** from localhost. You can still test with a **text-only** message if you add that in code.
- **After you deploy (e.g. Vercel):** Use your live URL (e.g. `https://your-app.vercel.app`) so the file link is public. Then automatic file send will work.

So: **automatic file sending works when your app is deployed with a public URL.**

---

## Step 7: Add Token and Phone Number ID to Your Project

1. Open your project folder and edit the **`.env`** file (or create `.env.local` if you use that).
2. Add or update these two lines (use your real values):

```env
WHATSAPP_ACCESS_TOKEN=your_long_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
```

Example:

```env
WHATSAPP_ACCESS_TOKEN=EAAU3PLMZBU2QBQmCgoAWa3UzPB9IJyWf7uaFasFlCXKeYFLJcsyNkvmFUiQo...
WHATSAPP_PHONE_NUMBER_ID=977328588797849
```

3. Save the file.
4. **Restart your app** (stop and run `npm run dev` again) so it loads the new env variables.

**Security:** Do **not** commit `.env` to Git (it should be in `.gitignore`). Do not share your token publicly.

---

## Step 8: Test Sending a Message

1. In your app, go to **Upload file**.
2. Upload a small PDF or image.
3. In **WhatsApp number**, enter one of the numbers you added in Step 5 (e.g. `919876543210`).
4. Click **Upload & send to WhatsApp**.

- If you see **“✓ Sent to WhatsApp”**, automatic sending is working.
- If you see an error:
  - **“Recipient phone number not in allowed list”** → Add that number in Step 5 (API Setup → To).
  - **“Could not send”** or URL error → When using **file** send, your app must be deployed with a **public URL** (see Step 6). On localhost, file send often fails; deploy to Vercel (or similar) and set `NEXT_PUBLIC_APP_URL` to that URL.

---

## Step 9 (Optional): Send to Any Number – Go to Production

To send to **any** WhatsApp number (not only the 5 test numbers):

1. **Add a real business phone number**
   - In your app: **WhatsApp** → **API Setup** or **Phone numbers**.
   - Add a new number that will be used only for WhatsApp Business API.
   - This number must **not** be on the WhatsApp or WhatsApp Business app on your phone (remove it from the app first if it is).
   - Verify it with the OTP Meta sends.

2. **Complete Business Verification**
   - Go to [business.facebook.com](https://business.facebook.com) → **Business settings** → **Security center**.
   - Start **Business verification** and submit the details and documents Meta asks for.

3. **Request production access**
   - In your app: **App Review** → **Permissions and features**.
   - Find **WhatsApp Business Management** and **WhatsApp Business Messaging** and request **Advanced** access.
   - Fill in the use case; Meta may review (can take a few days).

4. **Use the production number in your app**
   - In **API Setup**, select the **production** phone number (the one you added and verified).
   - Copy its **Phone number ID** and put it in `.env` as `WHATSAPP_PHONE_NUMBER_ID`.
   - Use a **long-lived** or **system user** token (see below) for `WHATSAPP_ACCESS_TOKEN`.

After approval, you can send to any number (within WhatsApp’s policies).

---

## Step 10 (Optional): Long-Lived or Permanent Token

The token from the API Setup page often expires in hours. For a token that lasts longer:

1. In your app, go to **Settings** → **Basic** and note your **App ID** and **App Secret**.
2. Go to **Tools** → **Graph API Explorer** (or **Meta for Developers** → **Tools** → **Graph API Explorer**).
3. Select your app, choose permissions that include **whatsapp_business_management** and **whatsapp_business_messaging**.
4. Generate a **User Token** (or use a **System User** under Business Manager for a token that doesn’t expire with a user session).
5. For a **long-lived User Token**: exchange the short-lived token using the endpoint in Meta’s docs (e.g. exchange short-lived for 60-day token).
6. Put the long-lived (or system user) token in `.env` as `WHATSAPP_ACCESS_TOKEN`.

For production, prefer a **System User** token so you don’t have to refresh it.

---

## Quick Checklist

| Step | What to do |
|------|------------|
| 1 | Create Meta Developer account at developers.facebook.com |
| 2 | Create an app (Business type) |
| 3 | Add product: WhatsApp → API Setup |
| 4 | Copy **Access token** and **Phone number ID** from API Setup |
| 5 | Add recipient phone number(s) under “To” (up to 5 in test mode) |
| 6 | Deploy app with a public URL for file sending to work |
| 7 | Add `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` to `.env` and restart app |
| 8 | Test: Upload file, enter WhatsApp number, send |
| 9 | (Optional) Add business number + verification + production for “any number” |
| 10 | (Optional) Use long-lived or System User token |

---

## Summary

- **Beginning:** Create Meta app → Add WhatsApp → Copy token + Phone number ID → Add to `.env` → Add test recipient → Test send.
- **Automatic file send:** Works when the file link is public (deploy app and set `NEXT_PUBLIC_APP_URL`).
- **Send to any number:** Add business number, complete verification, request production access, then use that number’s Phone number ID and a proper token.

If you tell me where you are (e.g. “I have the app created, what next?”), I can give the exact next steps for that part.
