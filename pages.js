/* =========================================================
   Perfect Love Wedding - pages.js
   Shared by story, gallery, rsvp, location and gift pages.
   (index.html uses script.js)
   ========================================================= */

/* ---------- Config: edit these ---------- */
const IMAGE_BASE = "./images"; // folder that holds your images
const GALLERY_IMAGES = [
  "/Pic 1.jpeg",
  "/Pic 2.jpeg",
  "/Pic 3.jpeg",
  "/Pic 4.jpeg",
  "/Pic 5.jpeg",
  "/Pic 6.jpeg",
  "/Pic 7.jpeg",
];

// Optional: paste a Formspree (or similar) endpoint to receive RSVPs by email.
// Example: "https://formspree.io/f/xxxxxxx". Leave empty to skip sending.
const FORM_ENDPOINT = "";

// encodeURI turns spaces into %20 so names like "Pic 1.jpeg" load reliably
const sources = GALLERY_IMAGES.map((p) => encodeURI(IMAGE_BASE + p));

/* ---------- Mobile navigation ---------- */
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

/* ---------- Countdown (only runs if the page has one) ---------- */
// Month is 0-based in JavaScript, so December = 11
const WEDDING_DATE = new Date(2026, 11, 5, 0, 0, 0);
const countdownBox = document.getElementById("countdown");

if (countdownBox) {
  const cd = {
    days: document.getElementById("cd-days"),
    hours: document.getElementById("cd-hours"),
    mins: document.getElementById("cd-mins"),
    secs: document.getElementById("cd-secs"),
  };

  const updateCountdown = () => {
    const diff = WEDDING_DATE - new Date();

    if (diff <= 0) {
      countdownBox.innerHTML = "<p>Today is the day. Celebrate with us!</p>";
      clearInterval(timer);
      return;
    }

    const s = Math.floor(diff / 1000);
    cd.days.textContent = Math.floor(s / 86400);
    cd.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
    cd.mins.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    cd.secs.textContent = String(s % 60).padStart(2, "0");
  };

  var timer = setInterval(updateCountdown, 1000);
  updateCountdown();
}

/* ---------- Lightbox (shared by marquee + gallery grid) ---------- */
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox ? lightbox.querySelector("img") : null;
let current = 0;

function showPhoto(i) {
  current = (i + sources.length) % sources.length;
  lightboxImg.src = sources[current];
}

function openLightbox(i) {
  if (!lightbox) return;
  showPhoto(i);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

if (lightbox) {
  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.classList.contains("lightbox-close")) closeLightbox();
    if (e.target.classList.contains("prev")) showPhoto(current - 1);
    if (e.target.classList.contains("next")) showPhoto(current + 1);
  });

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") showPhoto(current - 1);
    if (e.key === "ArrowRight") showPhoto(current + 1);
  });
}

/* ---------- Helper: build one clickable photo ---------- */
function makePhotoButton(src, index, lazy = true) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Open photo " + (index + 1));

  const img = document.createElement("img");
  img.src = src;
  img.alt = "Wedding gallery photo";
  if (lazy) img.loading = "lazy";

  btn.appendChild(img);
  btn.addEventListener("click", () => openLightbox(index));
  return btn;
}

/* ---------- Gallery marquee (only if the page has one) ---------- */
const track = document.getElementById("gallery-track");
if (track) {
  const half = [...sources, ...sources];      // 14 photos: wide enough for big screens
  [...half, ...half].forEach((src, i) => {    // two identical halves = seamless loop
    track.appendChild(makePhotoButton(src, i % sources.length, false));
  });
}

/* ---------- Gallery page: photo grid ---------- */
const grid = document.getElementById("photo-grid");
if (grid) {
  sources.forEach((src, i) => {
    grid.appendChild(makePhotoButton(src, i));
  });
}

/* ---------- RSVP form + QR pass ---------- */
const form = document.getElementById("rsvp-form");
if (form) {
  const pass = document.getElementById("pass");
  const status = document.getElementById("form-status");
  const guestsField = document.getElementById("guests-field");
  const qrBox = document.getElementById("qrcode");

  // Hide the guest count when someone declines
  form.addEventListener("change", (e) => {
    if (e.target.name === "attending") {
      guestsField.hidden = e.target.value === "no";
    }
  });

  const setError = (field, msg) => {
    form.querySelector(`[data-for="${field}"]`).textContent = msg;
    form.elements[field].classList.toggle("invalid", Boolean(msg));
  };

  const makeId = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike characters
    let id = "";
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return "PLW26-" + id;
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    let valid = true;

    setError("name", "");
    setError("email", "");
    setError("phone", "");

    if (!data.name.trim()) { setError("name", "Please enter your full name."); valid = false; }
    if (!/^\S+@\S+\.\S+$/.test(data.email)) { setError("email", "Please enter a valid email address."); valid = false; }
    if (data.phone && !/^[+\d][\d\s()-]{6,}$/.test(data.phone)) { setError("phone", "Please enter a valid phone number."); valid = false; }
    if (!valid) return;

    data.id = makeId();
    if (data.attending === "no") data.guests = 0;

    // Optional: send to your form service
    if (FORM_ENDPOINT) {
      status.textContent = "Sending...";
      try {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Request failed");
      } catch (err) {
        status.textContent = "We could not send your RSVP. Please check your connection and try again.";
        return;
      }
    }
    status.textContent = "";

    if (data.attending === "no") {
      form.hidden = true;
      pass.hidden = false;
      pass.querySelector("h2").textContent = "Thank you for letting us know";
      document.getElementById("pass-name").textContent = data.name;
      document.getElementById("pass-meta").textContent = "We will miss you, and we are grateful for your love.";
      qrBox.hidden = true;
      document.getElementById("pass-id").textContent = "";
      pass.querySelector(".pass-note").hidden = true;
      document.getElementById("download-pass").hidden = true;
      return;
    }

    // Build the QR pass
    form.hidden = true;
    pass.hidden = false;
    qrBox.hidden = false;
    pass.querySelector("h2").textContent = "You're confirmed";
    pass.querySelector(".pass-note").hidden = false;
    document.getElementById("download-pass").hidden = false;
    document.getElementById("pass-name").textContent = data.name;
    document.getElementById("pass-meta").textContent =
      `${data.guests} guest${data.guests > 1 ? "s" : ""} · 5 December 2026`;
    document.getElementById("pass-id").textContent = data.id;

    qrBox.innerHTML = "";
    new QRCode(qrBox, {
      text: JSON.stringify({ id: data.id, name: data.name, guests: data.guests }),
      width: 200,
      height: 200,
      correctLevel: QRCode.CorrectLevel.M,
    });
    pass.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  document.getElementById("download-pass").addEventListener("click", () => {
    const canvas = qrBox.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = document.getElementById("pass-id").textContent + ".png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });

  document.getElementById("new-rsvp").addEventListener("click", () => {
    form.reset();
    guestsField.hidden = false;
    form.hidden = false;
    pass.hidden = true;
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

/* ---------- Gift page: copy buttons ---------- */
document.querySelectorAll(".copy-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const original = btn.textContent;
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = original), 1500);
    } catch {
      btn.textContent = "Press Ctrl+C";
    }
  });
});


/* ---------- Hero carousel (homepage) ---------- */
const heroCarousel = document.getElementById("hero-carousel");
if (heroCarousel && sources.length > 1) {
  heroCarousel.innerHTML = "";

  // One <img> per photo, stacked on top of each other
  const slides = sources.map((src, i) => {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "Tosin and Raphael, photo " + (i + 1);
    if (i === 0) img.classList.add("active");
    else img.loading = "lazy";
    heroCarousel.appendChild(img);
    return img;
  });

  // Dots
  const dotsWrap = document.createElement("div");
  dotsWrap.className = "hero-dots";
  const dots = sources.map((_, i) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", "Show photo " + (i + 1));
    dot.addEventListener("click", () => { goTo(i); restart(); });
    dotsWrap.appendChild(dot);
    return dot;
  });
  heroCarousel.appendChild(dotsWrap);

  let index = 0;
  let timer = null;

  function goTo(i) {
    slides[index].classList.remove("active");
    dots[index].classList.remove("active");
    index = (i + slides.length) % slides.length;
    slides[index].classList.add("active");
    dots[index].classList.add("active");
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function start() {
    if (!reduceMotion) timer = setInterval(() => goTo(index + 1), 4000);
  }
  function stop() { clearInterval(timer); }
  function restart() { stop(); start(); }

  // Pause while the mouse is over the photo
  heroCarousel.addEventListener("mouseenter", stop);
  heroCarousel.addEventListener("mouseleave", start);

  dots[0].classList.add("active");
  start();
}