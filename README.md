# The Art of Forever

A six-page wedding website for **Tosin & Raphael** (#ArtFullyTee), built with plain HTML, CSS and JavaScript. No frameworks, installs or build tools are needed.

> **Note:** This is a build of https://artfullytee-tosinraphael.netlify.app/
**Wedding details used in this project**
- Date: Saturday, 5 December 2026

---

## 1. Project structure

```
perfect-love/
├── index.html      # Home page
├── story.html      # Our Story
├── gallery.html    # Photo gallery with lightbox
├── rsvp.html       # RSVP form with QR pass
├── location.html   # Venues, maps and directions
├── gift.html       # Gift the Couple
├── style.css       # Styling for every page
├── script.js       # Home page only: menu, countdown, gallery strip
├── pages.js        # All other pages: menu, gallery, RSVP, copy buttons
└── README.md       # This file
```

Keep every file in the **same folder**. The pages link to each other and to the CSS and JavaScript by file name.

---

## 2. Set up in VS Code

### Step 1: Install VS Code
Download it from https://code.visualstudio.com/ and install it.

### Step 2: Put the files in one folder
Create a folder named `perfect-love` and place all the files listed above inside it.

### Step 3: Open the folder in VS Code
1. Open VS Code
2. Go to **File > Open Folder...**
3. Select the `perfect-love` folder
4. Click **Yes, I trust the authors** if prompted

### Step 4: Install the Live Server extension
1. Click the **Extensions** icon in the left sidebar (`Ctrl+Shift+X`, or `Cmd+Shift+X` on Mac)
2. Search for **Live Server** (by Ritwick Dey)
3. Click **Install**

### Step 5: Run the website
1. Right-click `index.html` in the file explorer
2. Choose **Open with Live Server**
3. Your browser opens at `http://127.0.0.1:5500` and refreshes every time you save

**Without the extension:** double-click `index.html` to open it in your browser, and refresh manually after each change. Everything works this way except that some browsers block map embeds on `file://` pages, so Live Server is recommended.

---

## 3. Page-by-page guide

### Home (`index.html`)
Hero section, countdown, scrolling gallery strip, and cards for Our Story, When, Where and RSVP.

| To change | Where |
|-----------|-------|
| Headline, intro text, buttons | `index.html`, inside `<section class="hero">` |
| Countdown date | `WEDDING_DATE` at the top of `script.js` |
| Date, time and venue cards | `<section class="info">` in `index.html` |
| Hero photo | The `<img>` inside `<figure class="hero-photo">` |
| Gallery strip photos | `GALLERY_IMAGES` at the top of `script.js` |

Countdown format: `new Date("2026-11-21T12:00:00+01:00")`. The `+01:00` is Nigerian time (WAT).

### Our Story (`story.html`)
A timeline made of `<article class="chapter">` blocks. Each block has a label on the left (`chapter-year`) and a heading and paragraph on the right.

- Replace the placeholder paragraphs with your real story
- To add a chapter, copy one whole `<article class="chapter">...</article>` block and paste it where you want it
- To add a photo to a chapter, put an `<img src="..." alt="...">` inside `chapter-body`

### Gallery (`gallery.html`)
A masonry-style photo grid. Clicking a photo opens a full-screen viewer. Use the arrow buttons or the left and right arrow keys to move between photos, and `Esc` or the close button to exit.

Photos come from `GALLERY_IMAGES` in `pages.js`:

```js
const GALLERY_IMAGES = [
  "/gift/20251122_123807.jpg",
  "/t12.jpeg",
  // add more paths here
];
```

### RSVP (`rsvp.html`)
A form with these fields: full name, email, phone (optional), attending yes/no, number of guests (1 to 5) and an optional message.

How it works:
1. The form checks the name, email and phone and shows an error message under any field that is wrong.
2. If the guest answers **Yes**, a personal pass appears with their name, guest count, a unique ID (for example `PLW26-K7M2QX`) and a QR code. They can download it as a PNG.
3. If the guest answers **No**, they see a short thank-you message instead.
4. **Add another guest** resets the form so a family member can RSVP separately.

**Receiving the RSVPs (important):** by default nothing is saved anywhere, because this is a static site. To get each RSVP by email:
1. Create a free form at https://formspree.io
2. Copy your form URL, for example `https://formspree.io/f/abcdwxyz`
3. Paste it into `pages.js`:

```js
const FORM_ENDPOINT = "https://formspree.io/f/abcdwxyz";
```

Other options that need no code changes to the page are Netlify Forms or Google Forms, but they require adapting the form markup.

**QR code limits:** the QR code holds the guest's ID, name and guest count. There is no database that records which IDs are valid, so scanning at the entrance cannot verify a guest by itself. Use the list of RSVPs you collect (for example from Formspree) as your check-in list, or ask me to help build a check-in system.

The QR code library loads from cdnjs, so the RSVP page needs an internet connection.

### Location (`location.html`)
Two venue cards, each with an embedded Google Map and a **Get directions** button.

To fix a map pin, edit the search text in two places inside that venue's block:
- the `src="https://www.google.com/maps?q=...&output=embed"` of the `<iframe>`
- the `destination=...` in the directions link

Replace the venue name with the full street address for the most accurate result, using `+` instead of spaces. Also confirm that the ceremony and reception venues are assigned correctly.

### Gift the Couple (`gift.html`)
Three cards: bank transfer (Naira), international transfer, and gift registry. The **Copy** buttons copy the account number or email to the guest's clipboard.

- Replace `YOUR BANK NAME`, `ACCOUNT NAME` and `0000000000` with your real details
- Change **both** the visible text and the `data-copy="..."` value on each Copy button, because they are separate
- Delete any card you do not need
- Replace the `#` in the registry link with your real registry URL

Only publish real account details on a site you are comfortable sharing publicly.

---

## 4. Customising the design

### Colours
At the top of `style.css`, change the variables in `:root`. A change here updates every page.

```css
:root {
  --ivory: #fbf7f2;     /* page background */
  --blush: #f1dcd6;     /* gallery strip background */
  --rose: #b5535f;      /* buttons and accents */
  --rose-dark: #8f3c48; /* hover states and links */
  --ink: #2b2226;       /* main text */
  --muted: #6f6469;     /* secondary text */
  --gold: #b8924f;      /* small accents */
}
```

### Fonts
1. Pick fonts at https://fonts.google.com
2. Replace the Google Fonts `<link>` in the `<head>` of **every** HTML page
3. Update `--font-display` (headings) and `--font-body` (text) in `style.css`

### Navigation
The header is repeated in each HTML file. If you add, rename or remove a page, update the `<nav>` in all six files. The current page's link has `class="active"`.

---

## 5. Using local images (works offline)

By default the photos load from the live website. To keep them in your project:

1. Create an `images` folder inside `perfect-love`
2. Download each photo from the live site (right-click, **Save image as...**) into `images`
3. In **both** `script.js` and `pages.js`, update the config:

```js
const IMAGE_BASE = "";
const GALLERY_IMAGES = [
  "images/20251122_123807.jpg",
  "images/t12.jpeg",
];
```

4. In `index.html`, update the hero photo:

```html
<img src="images/20251122_123807.jpg" alt="Tosin and Raphael" />
```

Rename downloaded files carefully. File names are case-sensitive once the site is online.

---

## 6. Publishing the website

Because this is a static site, you can host it for free:

- **Netlify:** go to https://app.netlify.com/drop and drag the `The Art of Forever` folder onto the page
- **GitHub Pages:** push the folder to a GitHub repository, then enable Pages in the repository settings
- **Vercel:** import the project and deploy with the default settings

After publishing, open every page on your phone and test the RSVP form, the maps and the Copy buttons before sharing the link.

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| Page looks unstyled | Make sure `style.css` is in the same folder as the HTML files |
| Menu, gallery, countdown or RSVP not working | Make sure `script.js` (home) and `pages.js` (other pages) are in the same folder. Press `F12` and check the **Console** tab for errors |
| Images not showing | Check your internet connection, or confirm local file names match exactly, including capital letters |
| Map is blank | Open the site through Live Server instead of double-clicking the file, and check your internet connection |
| QR code does not appear | The QR library loads from the internet. Check your connection and refresh |
| Navigation link leads to an error page | Check that the target file exists in the folder and the name is spelled exactly the same |
| Live Server option missing | Make sure the extension is installed and you opened the **folder**, not a single file |
| Changes not showing | Save with `Ctrl+S`, then hard refresh with `Ctrl+Shift+R` |

---

## 8. Checklist before sharing

- [ ] Replaced the placeholder text on the Our Story page
- [ ] Replaced the placeholder bank and payment details on the Gift page
- [ ] Confirmed which venue hosts the ceremony and the reception
- [ ] Checked the map pins on the Location page
- [ ] Set `FORM_ENDPOINT` so you actually receive RSVPs
- [ ] Added or confirmed the gallery photos
- [ ] Tested every page on a phone

---

&copy; 2026 The Art of Forever
