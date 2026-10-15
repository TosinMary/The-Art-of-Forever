# Perfect Love Wedding Website

A static recreation of the homepage at https://perfectlove26.netlify.app/ built with plain HTML, CSS and JavaScript. No build tools or frameworks are needed.

> **Note:** This is a rebuild, not a copy of the original source code. The text, structure and images match the live site, but the design (colours, fonts, spacing) is a new one that you can freely edit.

---

## 1. Project structure

```
perfect-love/
├── index.html     # Home page
├── story.html     # Our Story
├── gallery.html   # Photo gallery with lightbox
├── rsvp.html      # RSVP form with QR pass
├── location.html  # Venues and maps
├── gift.html      # Gift the Couple
├── style.css      # All styling (shared by every page)
├── script.js      # Home page: menu, countdown, gallery strip
├── pages.js       # Other pages: menu, gallery, RSVP, copy buttons
└── README.md      # This file
```

---

## 2. Set up in VS Code

### Step 1: Install VS Code
Download it from https://code.visualstudio.com/ and install it.

### Step 2: Put the files in one folder
Create a folder named `perfect-love` on your computer and place `index.html`, `style.css`, `script.js` and `README.md` inside it. All files must sit in the same folder.

### Step 3: Open the folder in VS Code
- Open VS Code
- Go to **File > Open Folder...**
- Select the `perfect-love` folder
- Click **Yes, I trust the authors** if prompted

### Step 4: Install the Live Server extension
1. Click the **Extensions** icon in the left sidebar (or press `Ctrl+Shift+X`, `Cmd+Shift+X` on Mac)
2. Search for **Live Server** (by Ritwick Dey)
3. Click **Install**

### Step 5: Run the website
- Right-click `index.html` in the file explorer
- Choose **Open with Live Server**
- Your browser opens at `http://127.0.0.1:5500` and refreshes automatically each time you save a file

**No extension?** You can also double-click `index.html` to open it in your browser. You will need to refresh manually after each change.

---

## 3. Common edits

### Change the wedding date (countdown)
In `script.js`, edit the first line of the config:

```js
const WEDDING_DATE = new Date("2026-11-21T12:00:00+01:00");
```

The format is `YYYY-MM-DDTHH:MM:SS+01:00`, where `+01:00` is Nigerian time (WAT).

### Change names, text, venue or times
Open `index.html` and search (`Ctrl+F`) for the text you want to change, for example `Ibadan` or `Ceremony 12:00 PM`, then edit it directly.

### Change colours and fonts
At the top of `style.css`, edit the variables in `:root`:

```css
:root {
  --ivory: #fbf7f2;   /* page background */
  --blush: #f1dcd6;   /* gallery background */
  --rose: #b5535f;    /* buttons and accents */
  --rose-dark: #8f3c48;
  --ink: #2b2226;     /* main text */
  --gold: #b8924f;
}
```

Changing a value here updates it everywhere on the page.

To change fonts, pick new ones at https://fonts.google.com, update the `<link>` tag in the `<head>` of `index.html`, and update `--font-display` and `--font-body` in `style.css`.

### Add or replace gallery photos
Edit the list in `script.js`:

```js
const GALLERY_IMAGES = [
  "/gift/20251122_123807.jpg",
  "/t12.jpeg",
  // add more paths here
];
```

### Use local images (so the site works offline)
Right now the photos load from the live website. To store them in your project:

1. Create an `images` folder inside `perfect-love`
2. Download each photo from the live site (right-click an image, **Save image as...**) and save it in `images`
3. In `script.js`, change `IMAGE_BASE` and the paths:

```js
const IMAGE_BASE = "";
const GALLERY_IMAGES = [
  "images/20251122_123807.jpg",
  "images/t12.jpeg",
];
```

4. In `index.html`, update the hero photo:

```html
<img src="images/20251122_123807.jpg" alt="Gift and Victory" />
```

### Add your gifting details
Find the `<section class="gift" id="gift">` block near the bottom of `index.html` and replace the placeholder text with your account details or registry link. The "Gift the Couple" buttons scroll to this section.

---

## 4. Editing the other pages

| Page | What to edit |
|------|--------------|
| `story.html` | Replace the text in each `<article class="chapter">` block with your own story. Copy a block to add another chapter. |
| `gallery.html` | Photos come from `GALLERY_IMAGES` in `pages.js` (and `script.js` for the home page strip). |
| `rsvp.html` | The form works as is. To receive RSVPs by email, paste a Formspree URL into `FORM_ENDPOINT` in `pages.js`. |
| `location.html` | Confirm which venue hosts the ceremony and reception, and change the search text in each map `src` and directions link for more accurate pins. |
| `gift.html` | Replace the placeholder bank and payment details, or delete cards you don't need. |

**Important:** the story text and gift details are placeholders. I could not read the original pages, so add your own real details before sharing the site.

---

## 5. Limitations

- **RSVP and QR pass:** the QR pass is generated in the guest's browser, so the RSVP data is not stored anywhere unless you set `FORM_ENDPOINT` (see section 4). Without a backend, there is also no way to check guests in by scanning, because nothing records which IDs are valid. Use a service such as Formspree or Netlify Forms to collect the guest list.
- **Internet needed for fonts and images** unless you download them locally as described above.

---

## 6. Publishing the website

Because this is a static site, you can host it for free:

- **Netlify:** go to https://app.netlify.com/drop and drag the `perfect-love` folder onto the page
- **GitHub Pages:** push the folder to a GitHub repository, then enable Pages in the repository settings
- **Vercel:** import the project and deploy with the default settings

---

## 7. Troubleshooting

| Problem | Fix |
|---------|-----|
| Styles not applying | Check that `style.css` is in the same folder as `index.html` |
| Gallery or countdown not working | Check that `script.js` is in the same folder, then press `F12` and look in the **Console** tab for errors |
| Images not showing | Check your internet connection, or confirm the local image paths match the file names exactly (including capital letters) |
| Live Server option missing | Make sure the extension is installed and you opened the **folder**, not a single file |
| Changes not showing | Save the file with `Ctrl+S` and hard refresh the browser with `Ctrl+Shift+R` |

---

&copy; 2026 Perfect Love Wedding
