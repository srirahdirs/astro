# Next Steps After Business Verification (WhatsApp)

Your business is verified. Here’s what to do next.

---

## 1. Use the new token in the app

Your **.env** has been updated with the new access token.  
Phone number ID is already set: **977328588797849**.

**Restart the app** so it loads the new token:

```bash
# Stop the app (Ctrl+C) then:
npm run dev
```

---

## 2. Add who can receive messages (if still in test mode)

- In Meta: **WhatsApp** → **API Setup** → **Step 1: Select phone numbers**.
- Under **To**, add every phone number that should receive messages (with country code, e.g. `919789253515`).
- You can add up to **5 numbers** in test mode. Your screenshot already shows +91 97892 53515 – add any others you need.

---

## 3. Test automatic send from the app

1. Log in to **Wedding Profile Matcher**.
2. Go to **Upload file**.
3. Upload a small PDF or image.
4. In **WhatsApp number**, enter a number you added in Step 2 (e.g. `919789253515`).
5. Click **Upload & send to WhatsApp**.

- If you see **“✓ Sent to WhatsApp”**, automatic sending is working.
- If you see **“Recipient phone number not in allowed list”**, add that number in Meta (Step 2).
- **Sending files:** For document send to work, WhatsApp must be able to open the file URL. On **localhost** that often fails. Deploy the app (e.g. Vercel) and set **NEXT_PUBLIC_APP_URL** to your live URL so the file link is public.

---

## 4. (Optional) Send to any number – use production number

After verification you can request **production** access so you can send to **any** WhatsApp number (not only the 5 test numbers):

1. In your Meta app: **WhatsApp** → **API Setup** or **Phone numbers**.
2. **Add** a real business phone number (one not used on WhatsApp app), verify it with OTP.
3. In **App Review** → **Permissions and features**, request **Advanced** access for **WhatsApp Business Management** and **WhatsApp Business Messaging**.
4. After approval, in API Setup select the **production** number, copy its **Phone number ID**, and put it in **.env** as **WHATSAPP_PHONE_NUMBER_ID**.
5. Use a **System User** or **long-lived** token for **WHATSAPP_ACCESS_TOKEN** (so it doesn’t expire quickly).

---

## 5. Error: "Object with ID '...' does not exist, cannot be loaded due to missing permissions"

This usually means:

1. **Token expired** – Generate a new token in **API Setup** → **Generate access token**, then update `WHATSAPP_ACCESS_TOKEN` in `.env` and restart the app.
2. **Wrong Phone number ID** – In **API Setup** → **Step 1**, under **From**, copy the current **Phone number ID** and set it in `.env` as `WHATSAPP_PHONE_NUMBER_ID`. It can change if you switched number or recreated the app.
3. **Token and number mismatch** – Generate the token on the same screen where you see the **From** number; when asked, select the correct WhatsApp Business Account and phone number.

---

## 6. Token expiry

Tokens from **Generate access token** can expire (e.g. in 24 hours or 60 days). For production:

- Prefer a **System User** token (doesn’t expire with user login).
- Or refresh the token when it expires and update **.env**, then restart the app.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Restart app so new token in .env is loaded |
| 2 | In Meta, add recipient numbers under “To” (if in test mode) |
| 3 | Test: Upload file → enter WhatsApp number → send |
| 4 | If "Object does not exist" → new token + copy current Phone number ID from API Setup |
| 5 | (Optional) Add production number + request production access |
| 6 | (Optional) Use System User or long-lived token for production |

Your **.env** is already updated with the new token; restart the app and test.
