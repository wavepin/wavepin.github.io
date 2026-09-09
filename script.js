"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const canAnimate = typeof Element.prototype.animate === "function";
const root = document.documentElement;
const toast = document.querySelector(".toast");
const confettiLayer = document.createElement("div");
confettiLayer.className = "confetti-layer";
confettiLayer.setAttribute("aria-hidden", "true");
document.body.append(confettiLayer);
let toastTimer;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3200);
}

// The content is readable before (or without) JavaScript.
const revealElements = document.querySelectorAll(".reveal");
let revealObserver;
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  revealObserver = new IntersectionObserver((entries, observer) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.remove("awaiting");
        observer.unobserve(entry.target);
      }
    }
  }, { threshold: 0.06 });
  revealElements.forEach((element) => {
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.classList.add("awaiting");
    }
    revealObserver.observe(element);
  });
}

const letters = [...document.querySelectorAll(".name-letter")];
function bounceLetters() {
  if (reducedMotion.matches || !canAnimate) return;
  letters.forEach((letter, index) => {
    letter.getAnimations().forEach((animation) => animation.cancel());
    letter.animate([
      { transform: "translateY(0) rotate(0deg)" },
      { transform: `translateY(-24px) rotate(${index % 2 ? 7 : -7}deg)`, offset: 0.35 },
      { transform: "translateY(5px) rotate(1deg)", offset: 0.72 },
      { transform: "translateY(0) rotate(0deg)" },
    ], { duration: 680, delay: index * 45, easing: "cubic-bezier(.22,1,.36,1)" });
  });
}

// The asterisk is both a button and a small, momentum-based rotary toy.
const spinner = document.querySelector(".spinner");
const rotor = spinner.querySelector("svg");
let angle = 0;
let spinAnimation;
let drag;
let suppressClick = false;
spinner.disabled = false;
spinner.style.touchAction = "pan-y";
document.querySelector(".spin-caption").hidden = false;

function stopSpin() {
  if (!spinAnimation) return;
  // Preserve the visible orientation when a second spin interrupts the first.
  const transform = getComputedStyle(rotor).transform;
  if (transform !== "none") {
    const matrix = new DOMMatrixReadOnly(transform);
    angle = Math.atan2(matrix.b, matrix.a) * 180 / Math.PI;
  }
  spinAnimation.cancel();
  spinAnimation = undefined;
  rotor.style.transform = `rotate(${angle}deg)`;
}

function burst(x, y) {
  if (reducedMotion.matches || !canAnimate) return;
  const colors = ["var(--pink)", "var(--orange)", "var(--ink)"];
  const remaining = Math.max(0, 48 - document.querySelectorAll(".confetti").length);
  for (let index = 0; index < Math.min(14, remaining); index++) {
    const particle = document.createElement("span");
    particle.className = "confetti";
    particle.setAttribute("aria-hidden", "true");
    particle.style.setProperty("--x", `${x}px`);
    particle.style.setProperty("--y", `${y}px`);
    particle.style.setProperty("--color", colors[index % colors.length]);
    particle.style.borderRadius = index % 3 === 0 ? "50%" : "0";
    confettiLayer.append(particle);
    const direction = (index / 14) * Math.PI * 2;
    const distance = 80 + Math.random() * 150;
    const dx = Math.cos(direction) * distance;
    const dy = Math.sin(direction) * distance;
    const animation = particle.animate([
      { transform: "translate(-50%, -50%) scale(.3)", opacity: 1 },
      { transform: `translate(${dx}px, ${dy}px) rotate(${index * 47}deg) scale(1)`, opacity: 1, offset: .6 },
      { transform: `translate(${dx * 1.1}px, ${dy + 65}px) rotate(${index * 62}deg) scale(.4)`, opacity: 0 },
    ], { duration: 800 + Math.random() * 300, easing: "cubic-bezier(.15,.65,.4,1)" });
    animation.finished.then(() => particle.remove(), () => particle.remove());
  }
}

function spin(turn = 650) {
  stopSpin();
  const start = angle;
  angle += reducedMotion.matches ? 45 : turn;
  rotor.style.transform = `rotate(${angle}deg)`;
  if (!reducedMotion.matches && canAnimate) {
    const animation = rotor.animate([
      { transform: `rotate(${start}deg)` },
      { transform: `rotate(${angle}deg)` },
    ], { duration: 1600, easing: "cubic-bezier(.12,.72,.19,1)" });
    spinAnimation = animation;
    animation.finished.then(() => {
      if (spinAnimation === animation) spinAnimation = undefined;
    }, () => {});
  }
}

spinner.addEventListener("click", (event) => {
  if (suppressClick && event.detail !== 0) { suppressClick = false; return; }
  suppressClick = false;
  spin();
  const bounds = spinner.getBoundingClientRect();
  burst(event.detail ? event.clientX : bounds.left + bounds.width / 2,
    event.detail ? event.clientY : bounds.top + bounds.height / 2);
});
spinner.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !event.isPrimary) return;
  stopSpin();
  suppressClick = false;
  const bounds = spinner.getBoundingClientRect();
  const cx = bounds.left + bounds.width / 2;
  const cy = bounds.top + bounds.height / 2;
  drag = { id: event.pointerId, cx, cy, x: event.clientX, y: event.clientY,
    previous: Math.atan2(event.clientY - cy, event.clientX - cx), moved: false, velocity: 0 };
  spinner.setPointerCapture(event.pointerId);
});
spinner.addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7) return;
  drag.moved = true;
  const next = Math.atan2(event.clientY - drag.cy, event.clientX - drag.cx);
  const delta = Math.atan2(Math.sin(next - drag.previous), Math.cos(next - drag.previous)) * 180 / Math.PI;
  drag.previous = next;
  drag.velocity = delta;
  angle += delta;
  rotor.style.transform = `rotate(${angle}deg)`;
});
function endDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  const previous = drag;
  drag = undefined;
  if (spinner.hasPointerCapture(event.pointerId)) spinner.releasePointerCapture(event.pointerId);
  if (event.type === "pointerup" && previous.moved) {
    suppressClick = true;
    spin(Math.max(-900, Math.min(900, previous.velocity * 28)));
    burst(event.clientX, event.clientY);
  }
}
spinner.addEventListener("pointerup", endDrag);
spinner.addEventListener("pointercancel", endDrag);
spinner.addEventListener("lostpointercapture", endDrag);

const palettes = [
  { name: "Citron", acid: "#d9f461", pink: "#f5a6ce", orange: "#fe7045" },
  { name: "Bubblegum", acid: "#f5a6ce", pink: "#b4c5fa", orange: "#d9f461" },
  { name: "Periwinkle", acid: "#b4c5fa", pink: "#febf75", orange: "#f5a6ce" },
];
let paletteIndex = 0;
const remix = document.querySelector(".remix");
remix.hidden = false;
remix.addEventListener("click", () => {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  const palette = palettes[paletteIndex];
  for (const key of ["acid", "pink", "orange"]) root.style.setProperty(`--${key}`, palette[key]);
  document.querySelector('meta[name="theme-color"]').content = palette.acid;
  remix.setAttribute("aria-label", `Remix the color palette. Current palette: ${palette.name}`);
  bounceLetters();
  spin(210);
});

// Native dialog gives keyboard focus containment and Escape-to-close behavior.
const dialog = document.querySelector(".image-dialog");
const previewImage = dialog.querySelector("img");
const previewTitle = document.querySelector("#preview-title");
let previewTrigger;
if (typeof dialog.showModal === "function") {
  document.querySelectorAll("[data-preview]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      previewTrigger = link;
      previewImage.src = link.href;
      previewImage.alt = link.querySelector("img").alt;
      previewTitle.textContent = link.dataset.preview;
      dialog.showModal();
      document.body.classList.add("modal-open");
    });
  });
  dialog.querySelector(".close-preview").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    previewTrigger?.focus({ preventScroll: true });
  });
}

const copyButton = document.querySelector(".copy-button");
if (navigator.clipboard && window.isSecureContext) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("jasontd02@gmail.com");
      notify("Email copied");
    } catch {
      notify("Couldn’t copy. Select the email address to copy it.");
    }
  });
}

reducedMotion.addEventListener("change", () => {
  if (!reducedMotion.matches) return;
  stopSpin();
  revealObserver?.disconnect();
  revealElements.forEach((element) => element.classList.remove("awaiting"));
  letters.forEach((letter) => letter.getAnimations().forEach((animation) => animation.cancel()));
  document.querySelectorAll(".confetti").forEach((particle) => {
    particle.getAnimations().forEach((animation) => animation.cancel());
    particle.remove();
  });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopSpin();
});
document.querySelector("#year").textContent = new Date().getFullYear();
