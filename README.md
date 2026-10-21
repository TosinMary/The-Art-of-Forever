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

&copy; 2026 The Art of Forever
