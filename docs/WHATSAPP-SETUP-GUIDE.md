# WhatsApp – Manual Send (wa.me links)

This app uses **manual WhatsApp sending** — no API setup required. Click any "Message" or "Open WhatsApp" button to open a chat with that number.

## Where WhatsApp is used

- **Upload horoscope** – Enter up to 5 numbers; after upload, click each link to send the file URL
- **Send profile details** – Select profile and numbers; click links to send the message
- **Lookup** – "Open WhatsApp" button on each profile
- **Profiles list** – "Message" link for each profile with a number
- **Edit profile** – "Open WhatsApp" button when you have a number
- **Record share** – "Message" link on sender/recipient cards
- **Reminders** – "WhatsApp" link for each reminder (when the profile has a number)

## WhatsApp number input

Wherever you enter a WhatsApp number, you can:
- Type the number directly (e.g. 9876543210 or 919876543210)
- Type a **Profile ID** to search — select a profile to auto-fill their phone/WhatsApp

## File sharing

For horoscope uploads, the message includes a link to the file. Recipients click the link to view/download. Ensure `NEXT_PUBLIC_APP_URL` in `.env` points to your deployed URL so the link works for recipients.
