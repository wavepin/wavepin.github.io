"use strict";

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const revealElements = document.querySelectorAll(".reveal");
// Content is visible without JavaScript; enhance only with a supported observer.
if ("IntersectionObserver" in window && !reducedMotion.matches) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("awaiting");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
  );
  revealElements.forEach((element) => {
    // Never hide an element already on screen, including direct section links.
    if (element.getBoundingClientRect().top >= window.innerHeight)
      element.classList.add("awaiting");
    revealObserver.observe(element);
  });
  reducedMotion.addEventListener("change", () => {
    if (reducedMotion.matches) {
      revealElements.forEach((element) => element.classList.remove("awaiting"));
      revealObserver.disconnect();
    }
  });
}

const progress = document.querySelector(".reading-progress");
const sectionLinks = [...document.querySelectorAll("nav a")];
const sections = sectionLinks.map((link) =>
  document.querySelector(link.getAttribute("href")),
);
let scrollQueued = false;
function updateScrollState() {
  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const fraction =
    scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
  progress.style.transform = `scaleX(${fraction})`;
  let current = -1;
  sections.forEach((section, index) => {
    if (section.getBoundingClientRect().top <= window.innerHeight * 0.35)
      current = index;
  });
  if (fraction > 0.99) current = sections.length - 1;
  sectionLinks.forEach((link, index) => {
    if (index === current) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
  scrollQueued = false;
}
function queueScrollUpdate() {
  if (!scrollQueued) {
    scrollQueued = true;
    requestAnimationFrame(updateScrollState);
  }
}
window.addEventListener("scroll", queueScrollUpdate, { passive: true });
window.addEventListener("resize", queueScrollUpdate);
document
  .querySelectorAll("details")
  .forEach((details) => details.addEventListener("toggle", queueScrollUpdate));
updateScrollState();

const dialog = document.querySelector(".image-dialog");
const previewImage = dialog.querySelector("img");
const previewTitle = document.querySelector("#preview-title");
let previewTrigger;
if (typeof dialog.showModal === "function") {
  document.querySelectorAll("[data-preview]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      previewTrigger = link;
      previewImage.src = link.href;
      previewImage.alt = link.querySelector("img").alt;
      previewTitle.textContent = link.dataset.preview;
      dialog.showModal();
      document.body.classList.add("modal-open");
    });
  });
  dialog
    .querySelector(".close-preview")
    .addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      dialog.close();
  });
  dialog.addEventListener("close", () => {
    document.body.classList.remove("modal-open");
    previewTrigger?.focus({ preventScroll: true });
  });
}

const copyButton = document.querySelector(".copy-button");
const toast = document.querySelector(".toast");
let toastTimer;
if (navigator.clipboard && window.isSecureContext) {
  copyButton.hidden = false;
  copyButton.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("jasontd02@gmail.com");
      toast.textContent = "Email copied";
    } catch {
      toast.textContent = "Couldn’t copy. Select the email address to copy it.";
    }
    clearTimeout(toastTimer);
    toast.classList.add("visible");
    toastTimer = setTimeout(() => toast.classList.remove("visible"), 3500);
  });
}
document.querySelector("#year").textContent = new Date().getFullYear();
