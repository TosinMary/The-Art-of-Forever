/* =========================================================
   Perfect Love Wedding - script.js
   ========================================================= */

/* ---------- Config: edit these ---------- */
const WEDDING_DATE = new Date("2026-11-21T12:00:00+01:00"); // Ceremony, Lagos/Ibadan time (WAT)

// Image paths. These point to the live site for now.
// To use local copies, download them into an /images folder and change the BASE.
const IMAGE_BASE = "https://perfectlove26.netlify.app";
const GALLERY_IMAGES = [
  "/gift/20251122_123807.jpg",
  "/gift/20251123_100033.jpg",
  "/t12.jpeg",
  "/t22.jpeg",
  "/gift/groom1.jpeg",
  "/gift/t5.jpeg",
];

/* ---------- Mobile navigation ---------- */
const navToggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");

navToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});

nav.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

/* ---------- Countdown ---------- */
const cd = {
  days: document.getElementById("cd-days"),
  hours: document.getElementById("cd-hours"),
  mins: document.getElementById("cd-mins"),
  secs: document.getElementById("cd-secs"),
};

function updateCountdown() {
  const diff = WEDDING_DATE - new Date();

  if (diff <= 0) {
    document.getElementById("countdown").innerHTML =
      "<p>Today is the day. Celebrate with us!</p>";
    clearInterval(timer);
    return;
  }

  const s = Math.floor(diff / 1000);
  cd.days.textContent = Math.floor(s / 86400);
  cd.hours.textContent = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  cd.mins.textContent = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  cd.secs.textContent = String(s % 60).padStart(2, "0");
}

const timer = setInterval(updateCountdown, 1000);
updateCountdown();

/* ---------- Gallery marquee ---------- */
const track = document.getElementById("gallery-track");
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector("img");

// Render the list twice so the scrolling loop is seamless
[...GALLERY_IMAGES, ...GALLERY_IMAGES].forEach((path) => {
  const src = IMAGE_BASE + path;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.setAttribute("aria-label", "Open photo");

  const img = document.createElement("img");
  img.src = src;
  img.alt = "Wedding gallery photo";
  img.loading = "lazy";

  btn.appendChild(img);
  btn.addEventListener("click", () => openLightbox(src));
  track.appendChild(btn);
});

/* ---------- Lightbox ---------- */
function openLightbox(src) {
  lightboxImg.src = src;
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImg.src = "";
  document.body.style.overflow = "";
}

lightbox.addEventListener("click", (e) => {
  if (e.target === lightbox || e.target.classList.contains("lightbox-close")) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !lightbox.hidden) closeLightbox();
});
