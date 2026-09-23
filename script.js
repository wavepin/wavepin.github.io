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
  revealObserver = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.remove("awaiting");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.06 },
  );
  revealElements.forEach((element) => {
    if (element.getBoundingClientRect().top >= window.innerHeight) {
      element.classList.add("awaiting");
    }
    revealObserver.observe(element);
  });
}

const letters = [...document.querySelectorAll(".name-letter")];
const glyphs = letters.map((letter, index) => {
  letter.style.setProperty("--letter-index", index);
  return letter.querySelector(".name-glyph");
});
const heroName = document.querySelector(".hero-name");
let nameVisible = false;
function updateNameMotion() {
  heroName.classList.toggle(
    "is-idling",
    nameVisible && !document.hidden && !reducedMotion.matches,
  );
}
function checkNameVisibility() {
  const bounds = heroName.getBoundingClientRect();
  nameVisible = bounds.bottom > 0 && bounds.top < window.innerHeight;
  updateNameMotion();
}
if ("IntersectionObserver" in window) {
  const nameObserver = new IntersectionObserver(([entry]) => {
    nameVisible = entry.isIntersecting;
    updateNameMotion();
  });
  nameObserver.observe(heroName);
} else {
  window.addEventListener("scroll", checkNameVisibility, { passive: true });
  window.addEventListener("resize", checkNameVisibility);
  checkNameVisibility();
}
document.addEventListener("visibilitychange", updateNameMotion);
reducedMotion.addEventListener("change", updateNameMotion);

// Hover stays on the outer letter; reveal and remix use the inner glyph.
const letterMotions = new Map();
function bounceLetters() {
  if (reducedMotion.matches || !canAnimate) return;
  glyphs.forEach((letter, index) => {
    const transform = getComputedStyle(letter).transform;
    letterMotions.get(letter)?.cancel();
    const animation = letter.animate(
      [
        { transform },
        {
          transform: `translateY(-24px) rotate(${index % 2 ? 7 : -7}deg)`,
          offset: 0.35,
        },
        { transform: "translateY(5px) rotate(1deg)", offset: 0.72 },
        { transform: "translateY(0) rotate(0deg)" },
      ],
      {
        duration: 680,
        delay: index * 45,
        easing: "cubic-bezier(.22,1,.36,1)",
        fill: "backwards",
      },
    );
    letterMotions.set(letter, animation);
    animation.finished.catch(() => {});
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

function stopSpin() {
  if (!spinAnimation) return;
  // Preserve the visible orientation when a second spin interrupts the first.
  const transform = getComputedStyle(rotor).transform;
  if (transform !== "none") {
    const matrix = new DOMMatrixReadOnly(transform);
    angle = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
  }
  spinAnimation.cancel();
  spinAnimation = undefined;
  rotor.style.transform = `rotate(${angle}deg)`;
}

function burst(x, y) {
  if (reducedMotion.matches || !canAnimate) return;
  const colors = ["var(--pink)", "var(--orange)", "var(--ink)"];
  const remaining = Math.max(
    0,
    48 - document.querySelectorAll(".confetti").length,
  );
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
    const animation = particle.animate(
      [
        { transform: "translate(-50%, -50%) scale(.3)", opacity: 1 },
        {
          transform: `translate(${dx}px, ${dy}px) rotate(${index * 47}deg) scale(1)`,
          opacity: 1,
          offset: 0.6,
        },
        {
          transform: `translate(${dx * 1.1}px, ${dy + 65}px) rotate(${index * 62}deg) scale(.4)`,
          opacity: 0,
        },
      ],
      {
        duration: 800 + Math.random() * 300,
        easing: "cubic-bezier(.15,.65,.4,1)",
      },
    );
    animation.finished.then(
      () => particle.remove(),
      () => particle.remove(),
    );
  }
}

function spin(turn = 650) {
  stopSpin();
  const start = angle;
  angle += reducedMotion.matches ? 45 : turn;
  rotor.style.transform = `rotate(${angle}deg)`;
  if (!reducedMotion.matches && canAnimate) {
    const animation = rotor.animate(
      [
        { transform: `rotate(${start}deg)` },
        { transform: `rotate(${angle}deg)` },
      ],
      { duration: 1600, easing: "cubic-bezier(.12,.72,.19,1)" },
    );
    spinAnimation = animation;
    animation.finished.then(
      () => {
        if (spinAnimation === animation) spinAnimation = undefined;
      },
      () => {},
    );
  }
}

spinner.addEventListener("click", (event) => {
  if (suppressClick && event.detail !== 0) {
    suppressClick = false;
    return;
  }
  suppressClick = false;
  cyclePalette();
  spin();
  const bounds = spinner.getBoundingClientRect();
  burst(
    event.detail ? event.clientX : bounds.left + bounds.width / 2,
    event.detail ? event.clientY : bounds.top + bounds.height / 2,
  );
});
spinner.addEventListener("pointerdown", (event) => {
  if (event.button !== 0 || !event.isPrimary) return;
  stopSpin();
  suppressClick = false;
  const bounds = spinner.getBoundingClientRect();
  const cx = bounds.left + bounds.width / 2;
  const cy = bounds.top + bounds.height / 2;
  drag = {
    id: event.pointerId,
    cx,
    cy,
    x: event.clientX,
    y: event.clientY,
    previous: Math.atan2(event.clientY - cy, event.clientX - cx),
    moved: false,
    velocity: 0,
  };
  spinner.setPointerCapture(event.pointerId);
});
spinner.addEventListener("pointermove", (event) => {
  if (!drag || drag.id !== event.pointerId) return;
  if (
    !drag.moved &&
    Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 7
  )
    return;
  drag.moved = true;
  const next = Math.atan2(event.clientY - drag.cy, event.clientX - drag.cx);
  const delta =
    (Math.atan2(
      Math.sin(next - drag.previous),
      Math.cos(next - drag.previous),
    ) *
      180) /
    Math.PI;
  drag.previous = next;
  drag.velocity = delta;
  angle += delta;
  rotor.style.transform = `rotate(${angle}deg)`;
});
function endDrag(event) {
  if (!drag || drag.id !== event.pointerId) return;
  const previous = drag;
  drag = undefined;
  if (spinner.hasPointerCapture(event.pointerId))
    spinner.releasePointerCapture(event.pointerId);
  if (event.type === "pointerup" && previous.moved) {
    suppressClick = true;
    cyclePalette();
    spin(Math.max(-900, Math.min(900, previous.velocity * 28)));
    burst(event.clientX, event.clientY);
  }
}
spinner.addEventListener("pointerup", endDrag);
spinner.addEventListener("pointercancel", endDrag);
spinner.addEventListener("lostpointercapture", endDrag);

const palettes = [
  {
    name: "Blue",
    acid: "#b4c5fa",
    pink: "#febf75",
    orange: "#f5a6ce",
    "toolkit-accent": "#f5a6ce",
  },
  {
    name: "Pink",
    acid: "#f5a6ce",
    pink: "#b4c5fa",
    orange: "#d9f461",
    "toolkit-accent": "#d9f461",
  },
  {
    name: "Neon green",
    acid: "#d9f461",
    pink: "#f5a6ce",
    orange: "#fe7045",
    "toolkit-accent": "#b4c5fa",
  },
];
let paletteIndex = 0;
function cyclePalette() {
  paletteIndex = (paletteIndex + 1) % palettes.length;
  const palette = palettes[paletteIndex];
  for (const key of ["acid", "pink", "orange", "toolkit-accent"])
    root.style.setProperty(`--${key}`, palette[key]);
  document.querySelector('meta[name="theme-color"]').content = palette.acid;
  spinner.setAttribute(
    "aria-label",
    `Spin and change colors. Current palette: ${palette.name}`,
  );
  bounceLetters();
}

// Share viewport and motion-preference state across all thumbnail animations.
const stageMotions = new Map();
const visibleStages = new Set();
function updateStageMotion(stage) {
  const playing =
    visibleStages.has(stage) && !reducedMotion.matches && !document.hidden;
  stage.classList.toggle("is-playing", playing);
  stageMotions.get(stage)?.forEach((update) => update(playing));
}
const stageObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visibleStages.add(entry.target);
        else visibleStages.delete(entry.target);
        updateStageMotion(entry.target);
      });
    })
  : null;
function observeStageMotion(stage, update) {
  if (!stageMotions.has(stage)) {
    stageMotions.set(stage, []);
    stageObserver?.observe(stage);
  }
  if (update) stageMotions.get(stage).push(update);
  updateStageMotion(stage);
}
observeStageMotion(document.querySelector(".stage-scramblr"));
function updateStageMotions() {
  stageMotions.forEach((_, stage) => updateStageMotion(stage));
}
reducedMotion.addEventListener("change", updateStageMotions);
document.addEventListener("visibilitychange", updateStageMotions);
if (!stageObserver) {
  const checkStages = () => {
    stageMotions.forEach((_, stage) => {
      const bounds = stage.getBoundingClientRect();
      if (
        bounds.bottom > 0 && bounds.top < window.innerHeight &&
        bounds.right > 0 && bounds.left < window.innerWidth
      ) visibleStages.add(stage);
      else visibleStages.delete(stage);
      updateStageMotion(stage);
    });
  };
  window.addEventListener("scroll", checkStages, { passive: true });
  window.addEventListener("resize", checkStages);
  requestAnimationFrame(checkStages);
}

// Animate the key faces so their rotated button hit areas stay still.
document.querySelectorAll(".keyboard-key").forEach((key, index) => {
  const face = key.querySelector(".key-face");
  const stage = key.closest(".stage-autotyper");
  let motion;
  let stagePlaying = false;
  let bouncing = false;

  function animateFace(frames, timing) {
    const transform = getComputedStyle(face).transform;
    motion?.cancel();
    motion = face.animate([{ transform }, ...frames], timing);
    motion.finished.catch(() => {});
    return motion;
  }

  function invite() {
    if (
      !stagePlaying ||
      bouncing ||
      reducedMotion.matches ||
      !canAnimate ||
      document.hidden
    )
      return;
    if (motion?.playState === "paused") {
      motion.play();
      return;
    }
    if (motion?.playState === "running") return;
    const invitation = animateFace(
      [
        { transform: "translateY(0) scale(1)", offset: 0 },
        { transform: "translateY(-3px) scale(1.015)", offset: 0.25 },
        { transform: "translateY(0) scale(1)", offset: 0.5 },
        { transform: "translateY(3px) scale(.985)", offset: 0.75 },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: 1000, iterations: Infinity, easing: "linear" },
    );
    // Rejoin the other key's phase after a click bounce, too.
    const partner = [...stage.querySelectorAll(".key-face")]
      .find((candidate) => candidate !== face)
      ?.getAnimations().find((animation) =>
        animation.effect.getTiming().iterations === Infinity,
      );
    invitation.currentTime = partner
      ? (Number(partner.currentTime) + 500) % 1000
      : index * 500;
  }

  key.addEventListener("click", () => {
    if (reducedMotion.matches || !canAnimate) return;
    bouncing = true;
    const bounce = animateFace(
      [
        { transform: "translateY(3px) scale(.94)", offset: 0.12 },
        { transform: "translateY(-13px) scale(1.06)", offset: 0.38 },
        { transform: "translateY(2px) scale(.98)", offset: 0.64 },
        { transform: "translateY(-3px) scale(1.015)", offset: 0.82 },
        { transform: "translateY(0) scale(1)" },
      ],
      { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    bounce.finished.then(
      () => {
        if (motion !== bounce) return;
        bouncing = false;
        invite();
      },
      () => {},
    );
  });

  observeStageMotion(stage, (playing) => {
    stagePlaying = playing;
    if (reducedMotion.matches) {
      motion?.cancel();
      motion = null;
      bouncing = false;
    } else if (!playing) {
      motion?.pause();
    } else if (bouncing) {
      motion?.play();
    } else {
      invite();
    }
  });
});

const reviewStars = document.querySelector(".review-stars");
const reviewStage = reviewStars?.closest(".stage-reviews");
if (reviewStage && canAnimate) {
  const stars = [...reviewStars.children];
  const fillTime = 530;
  const growTime = 280;
  const drainTime = 660;
  const shrinkTime = 260;
  const holdTime = 200;
  // Each next star starts immediately; only the ends of the row settle and hold.
  const drainStart = stars.length * fillTime + growTime + holdTime;
  const duration = drainStart + stars.length * drainTime + shrinkTime + holdTime;
  const empty = "inset(0 100% 0 0)";
  const full = "inset(0 0% 0 0)";

  // All fills and pulses share one repeating timeline. Pausing retains the
  // exact partial fill, direction, and pulse; the first visit starts at 3/5.
  const animations = stars.flatMap((star, index) => {
    const fillAt = index * fillTime;
    const filledAt = fillAt + fillTime;
    const drainAt = drainStart + (stars.length - 1 - index) * drainTime;
    const drainedAt = drainAt + drainTime;
    const fill = star.querySelector(".review-star-fill").animate(
      [
        { clipPath: empty, offset: 0 },
        { clipPath: empty, offset: fillAt / duration },
        { clipPath: full, offset: filledAt / duration },
        { clipPath: full, offset: drainAt / duration },
        { clipPath: empty, offset: drainedAt / duration },
        { clipPath: empty, offset: 1 },
      ],
      { duration, iterations: Infinity },
    );
    const pulse = star.animate(
      [
        { transform: "scale(1)", offset: 0 },
        {
          transform: "scale(1)",
          offset: filledAt / duration,
          easing: "ease-out",
        },
        {
          transform: "translateY(-1px) scale(1.12)",
          offset: (filledAt + growTime * 0.45) / duration,
          easing: "ease-in-out",
        },
        { transform: "scale(1)", offset: (filledAt + growTime) / duration },
        {
          transform: "scale(1)",
          offset: drainedAt / duration,
          easing: "ease-out",
        },
        {
          transform: "translateY(1px) scale(.92)",
          offset: (drainedAt + shrinkTime * 0.45) / duration,
          easing: "ease-in-out",
        },
        { transform: "scale(1)", offset: (drainedAt + shrinkTime) / duration },
        { transform: "scale(1)", offset: 1 },
      ],
      { duration, iterations: Infinity },
    );
    for (const animation of [fill, pulse]) {
      animation.pause();
      animation.currentTime = 3 * fillTime;
    }
    return [fill, pulse];
  });

  observeStageMotion(reviewStage, (playing) => {
    animations.forEach((animation) =>
      playing ? animation.play() : animation.pause(),
    );
  });
}

// Keep the native dialog's focus and keyboard behavior while giving it a
// thumbnail-to-poster entrance and a matching return trip.
const dialog = document.querySelector(".image-dialog");
const previewImage = dialog.querySelector("img");
const previewTitle = document.querySelector("#preview-title");
let previewTrigger;
let previewMotion;
let previewClosing = false;

function previewOrigin() {
  const from = previewTrigger.getBoundingClientRect();
  // offsetWidth/Height ignore the animation currently applied to the dialog.
  const width = dialog.offsetWidth;
  const height = dialog.offsetHeight;
  const x = from.left + from.width / 2 - window.innerWidth / 2;
  const y = from.top + from.height / 2 - window.innerHeight / 2;
  const scale = Math.max(
    0.12,
    Math.min(0.85, from.width / width, from.height / height),
  );
  return `translate(${x}px, ${y}px) scale(${scale}) rotate(-8deg)`;
}

function settlePreview() {
  previewMotion?.cancel();
  previewMotion = undefined;
  if (previewClosing) dialog.close();
  previewClosing = false;
  dialog.classList.remove("is-closing");
}

function closePreview() {
  if (previewClosing || !dialog.open) return;
  if (reducedMotion.matches || !canAnimate) {
    dialog.close();
    return;
  }
  const current = getComputedStyle(dialog).transform;
  previewMotion?.cancel();
  previewClosing = true;
  dialog.classList.add("is-closing");
  const animation = dialog.animate(
    [
      { transform: current === "none" ? "none" : current, opacity: 1 },
      { transform: previewOrigin(), opacity: 0 },
    ],
    { duration: 450, easing: "cubic-bezier(.55,0,.8,.4)", fill: "forwards" },
  );
  previewMotion = animation;
  animation.finished.then(
    () => {
      if (previewMotion !== animation) return;
      dialog.close();
    },
    () => {},
  );
}

if (typeof dialog.showModal === "function") {
  document.querySelectorAll("[data-preview]").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;
      event.preventDefault();
      settlePreview();
      previewTrigger = link;
      const source = link.querySelector("img");
      previewImage.src = link.href;
      previewImage.alt = source.alt;
      const width = source.naturalWidth || Number(source.getAttribute("width"));
      const height = source.naturalHeight || Number(source.getAttribute("height"));
      previewImage.width = width;
      previewImage.height = height;
      dialog.style.setProperty("--preview-ratio", width / height);
      previewTitle.textContent = link.dataset.preview;
      dialog.showModal();
      document.body.classList.add("modal-open");
      if (!reducedMotion.matches && canAnimate) {
        const animation = dialog.animate(
          [
            { transform: previewOrigin(), opacity: 0.25 },
            {
              transform: "translate(0, -9px) scale(1.025) rotate(1.2deg)",
              opacity: 1,
              offset: 0.7,
            },
            { transform: "none", opacity: 1 },
          ],
          { duration: 820, easing: "cubic-bezier(.2,.8,.25,1)" },
        );
        previewMotion = animation;
        animation.finished.then(
          () => {
            if (previewMotion === animation) previewMotion = undefined;
          },
          () => {},
        );
      }
    });
  });
  dialog
    .querySelector(".close-preview")
    .addEventListener("click", closePreview);
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closePreview();
  });
  dialog.addEventListener("click", (event) => {
    const rect = dialog.getBoundingClientRect();
    if (
      event.target === dialog &&
      (event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom)
    )
      closePreview();
  });
  dialog.addEventListener("close", () => {
    previewMotion?.cancel();
    previewMotion = undefined;
    previewClosing = false;
    dialog.classList.remove("is-closing");
    document.body.classList.remove("modal-open");
    previewTrigger?.focus({ preventScroll: true });
  });
}

// Animate the measured height, so long paragraphs never get clipped by an
// arbitrary max-height. Repeated clicks reverse from the visible position.
const detailMotions = [];
document.querySelectorAll(".project-notes, .experience").forEach((details) => {
  const summary = details.querySelector("summary");
  const body = details.querySelector(".details-body");
  let targetOpen = details.open;
  let heightMotion;
  let textMotion;

  function settle() {
    const wasAnimating = Boolean(heightMotion);
    heightMotion?.cancel();
    textMotion?.cancel();
    heightMotion = textMotion = undefined;
    if (wasAnimating) details.open = targetOpen;
    else targetOpen = details.open;
    details.style.height = "";
    details.classList.remove("is-animating");
    details.removeAttribute("data-expanded");
    summary.removeAttribute("aria-expanded");
  }
  detailMotions.push(settle);
  details.addEventListener("toggle", () => {
    if (!heightMotion) targetOpen = details.open;
  });
  summary.addEventListener("click", (event) => {
    if (reducedMotion.matches || !canAnimate) return;
    event.preventDefault();
    const startHeight = details.getBoundingClientRect().height;
    const opacity = details.open ? getComputedStyle(body).opacity : 0;
    targetOpen = heightMotion ? !targetOpen : !details.open;
    heightMotion?.cancel();
    textMotion?.cancel();
    details.style.height = "";
    details.open = true;
    const box = getComputedStyle(details);
    const edges = [
      box.paddingTop,
      box.paddingBottom,
      box.borderTopWidth,
      box.borderBottomWidth,
    ].reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
    const endHeight = targetOpen
      ? details.getBoundingClientRect().height
      : summary.getBoundingClientRect().height + edges;
    details.classList.add("is-animating");
    details.setAttribute("data-expanded", String(targetOpen));
    summary.setAttribute("aria-expanded", String(targetOpen));
    details.style.height = `${endHeight}px`;
    const animation = details.animate(
      [
        { height: `${startHeight}px` },
        { height: `${endHeight}px` },
      ],
      { duration: targetOpen ? 720 : 560, easing: "cubic-bezier(.22,1,.36,1)" },
    );
    heightMotion = animation;
    textMotion = body.animate(
      [
        { opacity, transform: targetOpen ? "translateY(-16px)" : "none" },
        {
          opacity: targetOpen ? 1 : 0,
          transform: targetOpen ? "none" : "translateY(-12px)",
        },
      ],
      {
        duration: targetOpen ? 650 : 350,
        easing: "cubic-bezier(.2,.7,.3,1)",
        fill: "both",
      },
    );
    textMotion.finished.catch(() => {});
    animation.finished.then(
      () => {
        if (heightMotion === animation) settle();
      },
      () => {},
    );
  });
});

const toolDecks = [];
document.querySelectorAll(".tool-panel").forEach((panel) => {
  const button = panel.querySelector(".tool-deck-trigger");
  const list = panel.querySelector(".tool-list");
  const items = [...list.children];
  let animations = [];
  let spread = false;
  let tiltFrame;

  function resetTilt() {
    cancelAnimationFrame(tiltFrame);
    panel.style.removeProperty("--tilt-x");
    panel.style.removeProperty("--tilt-y");
  }

  function settle() {
    animations.forEach((animation) => animation.cancel());
    animations = [];
    panel.classList.remove("is-dealing");
  }

  function layoutStack() {
    if (spread) return;
    // Layout coordinates stay accurate while the panel itself tilts or reveals.
    const centerX = list.clientWidth / 2 - (items.length - 1);
    const centerY = list.clientHeight / 2 + (items.length - 1) * 1.5;
    items.forEach((item, index) => {
      item.style.setProperty("--deck-order", items.length - index);
      item.style.setProperty(
        "--stack-x",
        `${centerX - item.offsetLeft - item.offsetWidth / 2 + index * 2}px`,
      );
      item.style.setProperty(
        "--stack-y",
        `${centerY - item.offsetTop - item.offsetHeight / 2 - index * 3}px`,
      );
      item.style.setProperty("--stack-angle", `${-9 + index * 3}deg`);
    });
  }

  function deal() {
    if (spread) return;
    layoutStack();
    spread = true;
    panel.classList.remove("is-stacked");
    button.setAttribute("aria-expanded", "true");
    // Keep keyboard focus in the panel after its one-time control disappears.
    if (document.activeElement === button) panel.focus({ preventScroll: true });
    button.hidden = true;
    stackObserver?.disconnect();
    if (reducedMotion.matches || !canAnimate) return;
    panel.classList.add("is-dealing");
    animations = items.flatMap((item, index) => {
      const x = parseFloat(item.style.getPropertyValue("--stack-x"));
      const y = parseFloat(item.style.getPropertyValue("--stack-y"));
      const angle = item.style.getPropertyValue("--stack-angle");
      const rotation = item.style.getPropertyValue("--chip-angle");
      const timing = {
        duration: 780,
        delay: index * 55,
        easing: "cubic-bezier(.22,1,.36,1)",
        fill: "backwards",
      };
      const motion = item.animate(
        [
          {
            transform: `translate(${x}px, ${y}px) rotate(${angle}) scale(.96)`,
          },
          {
            transform: `translate(${x * 0.08}px, ${y * 0.08 - 10}px) rotate(${index % 2 ? 3 : -3}deg) scale(1.025)`,
            offset: 0.68,
          },
          { transform: `rotate(${rotation})` },
        ],
        timing,
      );
      // Reveal each face as its chip leaves the pile.
      const faces =
        index === 0
          ? []
          : [...item.children].map((face) =>
              face.animate(
                [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1 }],
                timing,
              ),
            );
      return [motion, ...faces];
    });
    Promise.allSettled(animations.map((animation) => animation.finished)).then(
      settle,
    );
  }

  const stackObserver =
    "ResizeObserver" in window ? new ResizeObserver(layoutStack) : undefined;
  layoutStack();
  panel.classList.add("is-stacked");
  button.hidden = false;
  stackObserver?.observe(list);
  document.fonts?.ready.then(layoutStack);
  toolDecks.push(() => {
    settle();
    resetTilt();
    layoutStack();
  });
  button.addEventListener("click", deal);
  panel.addEventListener("focusin", deal);
  panel.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "mouse") deal();
  });
  // A panel scrolled beneath a stationary pointer opens on the next mouse move.
  panel.addEventListener("pointermove", (event) => {
    if (event.pointerType !== "mouse") return;
    deal();
    if (reducedMotion.matches) return;
    cancelAnimationFrame(tiltFrame);
    tiltFrame = requestAnimationFrame(() => {
      const rect = panel.getBoundingClientRect();
      panel.style.setProperty(
        "--tilt-x",
        `${((event.clientY - rect.top) / rect.height - 0.5) * -5}deg`,
      );
      panel.style.setProperty(
        "--tilt-y",
        `${((event.clientX - rect.left) / rect.width - 0.5) * 5}deg`,
      );
    });
  });
  panel.addEventListener("pointerleave", resetTilt);
});

let finishIntro = () => {};
function startIntro() {
  const navigation = performance.getEntriesByType("navigation")[0];
  if (
    reducedMotion.matches ||
    !canAnimate ||
    location.hash ||
    window.scrollY > 24 ||
    navigation?.type === "back_forward"
  ) {
    heroName.classList.add("is-settled");
    return;
  }
  const scene = document.createElement("div");
  scene.className = "intro-scene";
  scene.setAttribute("aria-hidden", "true");
  const shutters = Array.from({ length: 3 }, () => {
    const shutter = document.createElement("div");
    shutter.className = "intro-shutter";
    scene.append(shutter);
    return shutter;
  });
  const mark = document.createElement("div");
  mark.className = "intro-mark";
  mark.append(rotor.cloneNode(true));
  scene.append(mark);
  document.body.append(scene);
  root.classList.add("intro-running");
  const motion = [];
  let done = false;
  let fallback;
  finishIntro = () => {
    if (done) return;
    done = true;
    clearTimeout(fallback);
    root.classList.remove("intro-running");
    motion.forEach((animation) => animation.cancel());
    scene.remove();
    heroName.classList.add("is-settled");
    updateNameMotion();
    document.removeEventListener("pointerdown", finishIntro, true);
    document.removeEventListener("keydown", finishIntro, true);
    window.removeEventListener("wheel", finishIntro);
    window.removeEventListener("scroll", finishIntro);
  };
  // A failed/cancelled animation must never leave a curtain over the page.
  fallback = setTimeout(finishIntro, 3400);
  document.addEventListener("pointerdown", finishIntro, {
    capture: true,
    once: true,
  });
  document.addEventListener("keydown", finishIntro, {
    capture: true,
    once: true,
  });
  window.addEventListener("wheel", finishIntro, { passive: true, once: true });
  window.addEventListener("scroll", finishIntro, { passive: true, once: true });
  shutters.forEach((shutter, index) => {
    motion.push(
      shutter.animate(
        [
          { transform: "translateY(0)" },
          { transform: `translateY(${index % 2 ? 105 : -105}%)` },
        ],
        {
          duration: 900,
          delay: 300 + index * 90,
          easing: "cubic-bezier(.76,0,.24,1)",
          fill: "both",
        },
      ),
    );
  });
  const target = rotor.getBoundingClientRect();
  const initial = mark.getBoundingClientRect();
  const dx =
    target.left + target.width / 2 - (initial.left + initial.width / 2);
  const dy =
    target.top + target.height / 2 - (initial.top + initial.height / 2);
  const ratio = spinner.offsetWidth / initial.width;
  motion.push(
    mark.animate(
      [
        { transform: "scale(.02) rotate(-210deg)", offset: 0 },
        { transform: "scale(1.15) rotate(80deg)", offset: 0.3 },
        { transform: "scale(.93) rotate(145deg)", offset: 0.47 },
        {
          transform: `translate(${dx}px, ${dy}px) scale(${ratio}) rotate(348deg)`,
          offset: 1,
        },
      ],
      { duration: 2100, easing: "cubic-bezier(.3,.65,.25,1)", fill: "both" },
    ),
  );
  motion.push(
    mark.querySelector(".asterisk").animate(
      [
        { fill: getComputedStyle(root).getPropertyValue("--acid").trim() },
        { fill: getComputedStyle(root).getPropertyValue("--ink").trim() },
      ],
      {
        duration: 800,
        delay: 1050,
        fill: "both",
      },
    ),
  );
  glyphs.forEach((letter, index) => {
    const animation = letter.animate(
      [
        {
          opacity: 0,
          transform: `translateY(.45em) rotate(${index % 2 ? 8 : -8}deg) scale(.92)`,
        },
        {
          opacity: 1,
          transform: "translateY(-7px) rotate(-1deg) scale(1.015)",
          offset: 0.75,
        },
        { opacity: 1, transform: "none" },
      ],
      {
        duration: 760,
        delay: 1100 + index * 110,
        easing: "cubic-bezier(.2,.85,.3,1)",
        fill: "both",
      },
    );
    letterMotions.set(letter, animation);
    motion.push(animation);
  });
  Promise.allSettled(motion.map((animation) => animation.finished)).then(
    finishIntro,
  );
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
  finishIntro();
  settlePreview();
  detailMotions.forEach((settle) => settle());
  toolDecks.forEach((settle) => settle());
  revealObserver?.disconnect();
  revealElements.forEach((element) => element.classList.remove("awaiting"));
  letterMotions.forEach((animation) => animation.cancel());
  document.querySelectorAll(".confetti").forEach((particle) => {
    particle.getAnimations().forEach((animation) => animation.cancel());
    particle.remove();
  });
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopSpin();
    finishIntro();
  }
});
document.querySelector("#year").textContent = new Date().getFullYear();

window.addEventListener("resize", () => {
  finishIntro();
  settlePreview();
  detailMotions.forEach((settle) => settle());
  toolDecks.forEach((settle) => settle());
});
startIntro();
