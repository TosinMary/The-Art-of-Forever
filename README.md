# The Art of Forever: Tosin & Raphael (#ArtFullyTee)

Wedding website with **seat booking, emailed access cards, an admin dashboard with Excel export, and a QR check-in scanner** for the day.

- **Date:** Saturday, 5 December 2026, Ceremony 10:00 AM
- **Venue:** KBK Event Center, off Akala Express, New Garage, Ibadan
- **Live site:** https://artfullytee-tosinraphael.netlify.app

---

## 1. What the application does

| Feature | Description |
|---|---|
| Public website | Home (carousel and countdown), Our Story, Gallery, RSVP, Location, Gift the Couple |
| Light / dark theme | Toggle button in the header. The choice is remembered in the browser |
| Seat booking | Guests pick their side and category, then tap seats on a table map |
| No double booking | A booked seat is locked instantly and shows as taken to everyone |
| Access card | Shown on screen, emailed to the guest, and an SMS with a link is sent (when SMS is set up) |
| Admin dashboard | See all bookings, release a seat, free stuck seats, download an Excel sheet |
| Check-in scanner | Ushers scan the QR in the guest's email. Green = valid, red = used or invalid |
| Photo Wall | Guests sign in with the reference on their access card (or the shared guest code if they did not book a seat), take or upload up to 5 photos, and scroll through everyone's photos. Each guest can download only their own. The couple can view, download and delete all. Uploads and deletions close at 6:00 AM on 6 December 2026 |
| My reference | After booking, the guest's reference is shown on their card and remembered on that device (a small "My reference" tag on every page). On any other phone or computer the guest enters the email and phone number they booked with (home page or RSVP page) to bring it back, or has the card emailed again. Opening the "View card online" link from the email also restores it |
| Photo Wall banner | A clear Photo Wall section on the home page explains how to get in (reference, guest code, or find your reference) |
| Order of Program | A page guests can open only from 5:00 AM on 5 December 2026. The server checks the time, so it cannot be opened early by changing a phone's clock |
| Notifications | You get an email for every booking and every release |

---

## 2. How it works

```
 Guest browser                    Netlify                         Services
 -------------      +-------------------------------+      ------------------
 rsvp.html          |  /api/*  -> netlify/functions |      Brevo  (email)
 seats.js   ------> |  api.mjs  (all backend logic) | ---> Termii (SMS)
 admin.html         |            |                  |      qrserver.com (QR image
 checkin.html       |            v                  |        shown in the email)
                    |   Netlify Blobs (database)    |
                    |   stores: seats, bookings     |
                    +-------------------------------+
```

The site is plain HTML, CSS and JavaScript. The only server code is one Netlify Function (`api.mjs`). Data is stored in **Netlify Blobs**, which needs no separate database account.

### Guest journey
1. Guest opens **RSVP** and chooses **Bride's Family** or **Groom's Family / Couple's Guests**.
2. On the groom side they choose a category from the dropdown (for example Aso Ebi Ladies).
3. They enter name, email and phone, then tap one or more seats (up to 10 per booking).
4. On **Confirm**, the server locks each seat with a "reserve only if free" write. If someone got there first, the guest is told and the map refreshes.
5. The booking is saved, and the **access card** appears on screen, is emailed, and an SMS is sent.

### On the wedding day
1. Usher opens `/checkin.html`, enters the **usher key**, and taps **Start scanner**.
2. The guest shows the QR from their email. The usher sees:
   - **VALID** (green): name, category and table. Arrival time is recorded.
   - **ALREADY USED** (red): the card was scanned before, with the time.
   - **INVALID** (red): the card was released or is not recognised.
3. If the QR will not scan, the usher types the reference (for example `ART-ZMLPYY`) into the box.

### Fixing a mistake (release a seat)
1. Open `/admin.html`, enter the admin key, click **Load**.
2. Click **Release seats** next to the guest. The seats become free, the old card turns invalid, and the guest and you are notified to rebook.
3. If a failed booking left a seat locked with no record, the yellow box lists it with a **Free this seat** button.

---

## 3. Seating layout (300 seats)

Defined in `netlify/functions/config.mjs`. Change it there and nothing else needs editing.

| Side | Category | Tables | Seats |
|---|---|---|---|
| Bride's Family | Bride's Family | 1 to 15 | 10 each (150) |
| Groom / Couple's | Aso Ebi Ladies | 16 | 7 |
| | Groomsmen | 17 | 7 |
| | Groom's Family | 18, 19 | 10 each |
| | Groom's Friends | 20 | 10 |
| | Bride's Friends | 21 | 10 |
| | Cobranet | 22, 23 | 10 each |
| | D.light | 24 | 10 |
| | FUOYE | 25 | 10 |
| | Damilola's Friends | 26 | 10 |
| | Korede's Friends | 27, 28 | 10 each |
| | KUDA | 29, 30 | 10 each |
| | Vendors | 31 | 6 |

The groom side totals 150 seats.

---

## 4. Project structure

```
ArtfullyTee/
├── index.html, story.html, gallery.html, location.html, gift.html
├── rsvp.html            Seat booking page and on-screen access card
├── admin.html           Admin dashboard (key protected)
├── checkin.html         Usher QR scanner (key protected)
├── style.css            All styling, including dark mode and carousel
├── pages.js             Menu, gallery, carousel, countdown, theme toggle
├── seats.js             Seat map, booking, access card
├── images/              Photos (Pic 1.jpeg ... Pic 7.jpeg)
├── netlify.toml         Netlify settings
├── package.json         Dependencies (@netlify/blobs, exceljs)
└── netlify/functions/
    ├── api.mjs          Backend: booking, admin, check-in, email, SMS, Excel
    └── config.mjs       Seating layout and wedding date text
```

---

## 5. Backend API (`/api/...`)

| Method and path | Who | Purpose |
|---|---|---|
| `GET /api/config` | Public | Seating layout and date |
| `GET /api/taken` | Public | List of booked seats |
| `POST /api/photo-login` | Public | Sign in with a card reference, a personal GST code, the shared guest code plus a name, or the admin key |
| `POST /api/find-reference` | Public | Returns the reference when the email AND phone number match a confirmed booking (5 wrong tries per email per hour) |
| `POST /api/resend-card` | Public | Email the access card again to the address it was booked with (same reply whether or not a booking exists) |
| `GET /api/photos` | Signed in | List photos (newest first, 60 at a time, `?mine=1` for own photos) |
| `GET /api/photo?id=...&size=thumb\|view\|full` | Signed in | Photo image. `full` (download) only for the owner or the couple |
| `POST /api/photo-upload` | Signed in | Upload one photo (three JPEG sizes) |
| `POST /api/photo-delete` | Owner or couple | Delete a photo |
| `GET /api/photo-status` | Public | Whether the photo wall is open |
| `GET /api/program-status` | Public | Whether the program is open yet, and when it opens |
| `GET /api/program` | Public, time-locked | The order of program (403 until the unlock time) |
| `GET /api/card?id=ART-XXXXXX` | Public | Card details for the "View card online" link |
| `POST /api/book` | Public | Create a booking |
| `POST /api/admin/checkin` | Admin or usher key | Scan result and arrival record |
| `GET /api/admin/list` | Admin key | All bookings |
| `POST /api/admin/release` | Admin key | Release a booking |
| `GET /api/admin/orphans` | Admin key | Seats locked with no active booking |
| `POST /api/admin/freeseat` | Admin key | Free a stuck seat |
| `GET /api/admin/export` | Admin key | Download `wedding-guests.xlsx` |

Admin calls send the key in an `x-admin-key` header. The **usher key** works only for check-in.

### Data stored (Netlify Blobs)
- **`seats` store:** `s:<table>-<seat>` holds the booking reference. `a:<ref>` holds the arrival time (this is what stops one card entering twice).
- **`bookings` store:** `b:<ref>` holds the booking: name, email, phone, grouping, category, seats, status (`confirmed` or `released`), booked time, arrival and release time.

---

## 6. Integrations

### Email: Brevo
- Sent through Brevo's transactional API (free plan: 300 emails a day).
- Sender display name: **Tosin & Raphael's Wedding** (change with `SENDER_NAME`).
- The access card email shows name, grouping, category, table, date, QR code and reference. The seat number is intentionally not shown.
- The sender address must be verified in Brevo.

### SMS: Termii (optional)
- Sends category, table, reference and a link to the card.
- Needs a Termii API key and an **approved sender ID**. Without them SMS is skipped and everything else works.
- Nigerian numbers are converted to international format (`080...` becomes `23480...`).

### QR code
- Contains `ART-XXXXXX|Guest Name`. It is not a web link, so a normal phone camera shows only text. Only the check-in page uses it.
- The email's QR picture is generated by `api.qrserver.com`, so the reference and name pass through that service. The on-screen card generates its QR in the browser.

### Excel export
Columns: Ref, Name, Email, Phone, Grouping, Category, Table(s), Seat(s), Status, Booked at, Arrived at. Released bookings stay in the sheet marked `released`.

---

## 7. Environment variables

Set in **Netlify, Site configuration, Environment variables** (tick "Contains secret values" for keys and passwords). For local testing put them in a `.env` file in the project root.

| Variable | Required | Purpose |
|---|---|---|
| `ADMIN_KEY` | Yes | Password for `admin.html` |
| `USHER_KEY` | Yes | Password for `checkin.html` (check-in only) |
| `ADMIN_EMAIL` | Yes | Receives booking and release notices |
| `BREVO_API_KEY` | Yes | Brevo API key (starts with `xkeysib-`) |
| `SENDER_EMAIL` | Yes | Verified Brevo sender address |
| `SENDER_NAME` | No | Display name (default: Tosin & Raphael's Wedding) |
| `PHOTO_GUEST_CODE` | No | The shared photo-wall code for guests without a booking. Overrides `GENERIC_PHOTO_REF` in `config.mjs` |
| `PHOTOS_UPLOAD_UNTIL_AT` | No | Testing only: overrides the upload deadline |
| `PHOTOS_OPEN_AT` | No | Testing only: overrides when the photo wall opens. **Delete it before launch** |
| `PHOTO_SECRET` | No | Secret used to sign photo-wall sign-ins. If missing, it is derived from `ADMIN_KEY` |
| `PROGRAM_UNLOCK_AT` | No | Testing only: overrides the unlock time (for example `2020-01-01T00:00:00+01:00` to preview it). **Delete it before launch** |
| `TERMII_API_KEY` | No | Enables SMS |
| `TERMII_SENDER` | No | Approved Termii sender ID |

Never commit `.env`. Use this `.gitignore`:
```
node_modules
.env
.netlify
```

---

## 8. Running locally (Mac)

```
cd ~/Desktop/ArtfullyTee
npm install
npx netlify-cli dev
```
Open `http://localhost:8888`. Opening the HTML files directly from the folder will not work because the booking needs the backend.

Local bookings are stored on your computer only and do not appear on the live site.

---

## 9. Deploying

1. Push the folder to a GitHub repository and connect it to the Netlify site (or run `npx netlify-cli deploy --prod`).
2. Add the environment variables, then trigger a new deploy.
3. **Dragging a folder onto Netlify Drop does not run the backend.**

### Test checklist before sharing the link
- [ ] Book a seat with your own email and phone. Card appears, email arrives (check spam).
- [ ] The seat now shows as taken in a private window.
- [ ] `/admin.html` lists the booking. **Release seats** frees it and emails you and the guest.
- [ ] **Download Excel** opens correctly.
- [ ] `/checkin.html` on a phone: scan the email QR, then scan again to see the red "Already used".
- [ ] Release every test booking so those seats are open.
- [ ] Test the dark mode toggle, the carousel and the map on a phone.

---

## 10. Customising

| To change | Edit |
|---|---|
| Tables, categories, seat counts, date text | `netlify/functions/config.mjs` |
| Email card design and wording | `cardHtml` in `netlify/functions/api.mjs` |
| SMS wording | `notifyBooked` and `notifyReleased` in `api.mjs` |
| Colours and dark mode | Tokens at the top of `style.css` and the `THEME TOGGLE` section |
| Carousel and gallery photos | `GALLERY_IMAGES` in `pages.js` |
| Photo wall opening time, upload deadline, photos per guest, shared guest code | `PHOTOS_OPEN`, `PHOTOS_UPLOAD_UNTIL`, `MAX_PHOTOS_PER_GUEST`, `GENERIC_PHOTO_REF` in `config.mjs` |
| Order of program items and unlock time | `PROGRAM` and `PROGRAM_UNLOCK` in `netlify/functions/config.mjs` |
| Story text | `story.html` |
| Bank details | `gift.html` (change both the text and the `data-copy` value) |
| Countdown | `WEDDING_DATE` in `pages.js` (months start at 0, December = 11) |

---

## 11. Limitations to be aware of

- **Anyone with the RSVP link can book.** There is no invite-code check yet. Personal invite codes would be the next improvement.
- Guests cannot cancel or change their own seats. Only the admin can release.
- The QR is plain text and is not cryptographically signed. The check-in page verifies it against the database.
- Brevo's free plan allows 300 emails a day. A Gmail sender address can land in spam, so a domain email improves delivery.
- Check-in needs phone signal or Wi-Fi at the venue. Test it on site.
- Maximum 10 seats per booking.
- **Photo wall storage:** photos are kept in Netlify Blobs. A full-size photo is about 0.5 to 1.2 MB, so 300 guests sharing 20 photos each could reach several GB. Check your Netlify plan's Blobs allowance before the wedding, and lower `MAX_PHOTOS_PER_GUEST` if needed.
- **Photo wall and screenshots:** a website cannot switch screenshots off. Guests can see each other's photos, so a determined guest can still photograph or screenshot their screen. The wall adds deterrents: other guests' photos are painted on a canvas (no "save image"), carry a faint watermark with the viewer's name and reference, blur when the page loses focus or a screenshot shortcut is pressed, block right-click, long-press save, drag and printing, and only the owner can download the full-size file.
- **Photo wall sign-in:** anyone who has a guest's reference can sign in as that guest. The shared guest code lets anyone who knows it create a personal GST code, so share it only with guests who did not book (up to 500 such sign-ins). A guest keeps at most 5 photos on the wall at a time, and deleting a photo frees a slot until uploads close.

---

## 12. Troubleshooting

| Problem | Fix |
|---|---|
| Page looks unstyled | Make sure `style.css` is in the project root and linked by exactly that name |
| Seat map is blank | You opened the file directly. Use `localhost:8888` or the live site |
| "Server error" on booking | Check the Terminal (local) or Netlify, Functions, `api` logs |
| No email | Terminal shows `EMAIL SKIPPED` (variables missing) or `BREVO ERROR` (wrong key or unverified sender) |
| Admin says wrong key | `ADMIN_KEY` is not set where the server runs, or you redeployed without it |
| A seat is stuck as taken | `/admin.html`, **Load**, then **Free this seat** in the yellow box |
| Scanner cannot open camera | Use the live https address and allow camera access |
| Excel download fails | Run `npm install exceljs@latest` and redeploy |
| `command not found: netlify` | Use `npx netlify-cli dev` |

---

## 13. Security

No website can be promised "unhackable". This app is built to make attacks hard and to limit the damage if something goes wrong.

| Protection | How it works |
|---|---|
| HTTPS only | Netlify serves the site over https and the headers force browsers to keep using it |
| Secret keys stay on the server | `ADMIN_KEY`, `USHER_KEY`, `BREVO_API_KEY` and `TERMII_API_KEY` live in Netlify environment variables and are never in the page code |
| Constant-time key check | Keys are compared in a way that does not leak information through response time |
| Rate limiting | 10 wrong key attempts in 15 minutes locks that visitor out. Booking is limited to 8 attempts per 10 minutes, card lookups to 60 per 10 minutes |
| Admin cannot be reached by guests | Every admin action needs the key in a request header. The usher key can only check guests in |
| Strict booking checks | Seat codes, name, email and phone are validated and length-limited on the server. A seat can only be written once, so two guests cannot hold the same seat |
| Bot trap | A hidden field on the RSVP form that only bots fill in. Those requests are refused |
| Safe display of guest input | Names and emails are escaped everywhere they are shown (pages, admin, check-in, emails) |
| Unguessable references | Card references are generated with a cryptographically secure random generator |
| Private files not served | `.env`, `package.json`, `netlify/` and similar paths return 404 on the live site |
| Browser protections | Content-Security-Policy, X-Frame-Options (no framing), X-Content-Type-Options, Referrer-Policy and Permissions-Policy headers in `netlify.toml` |
| Private pages hidden | `admin.html` and `checkin.html` are marked no-index and no-store |
| Usher phones | The saved usher key expires after 12 hours and the **Lock** button clears it |

### Your responsibilities
- Choose long, unique keys (16+ characters) and **change them if they appear in a screenshot or message**.
- Turn on **two-factor authentication** for Netlify, GitHub, Brevo and Termii.
- Never commit `.env`. Check `https://your-site/.env` shows "Page not found".
- Give the usher key only to ushers, and change it after the wedding.
- Download the Excel sheet regularly as a backup.
- After the wedding, consider deleting guest data, because it contains names, phone numbers and emails.

### Known limits
- Anyone with the RSVP link can still try to book. Invite codes or Cloudflare Turnstile (a free CAPTCHA) would be the next layer.
- The CSP allows inline scripts because the pages use them. It still blocks scripts and frames from other websites.
- Rate limiting is per visitor address, so people sharing one network share a limit.

---

&copy; 2026 The Art of Forever
