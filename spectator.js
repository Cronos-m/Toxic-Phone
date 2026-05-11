const TRIGGER_CODE = "*#06#";
const MAX_VISIBLE_LENGTH = 28;

const state = {
  entered: "",
  unsubscribe: null,
  isAndroid: false,
  device: {
    imei1: "--",
    imei2: "--",
    sn: "--"
  }
};

const elements = {
  display: document.getElementById("numberDisplay"),
  deleteButton: document.getElementById("deleteButton"),
  modal: document.getElementById("deviceModal"),
  modalTitle: document.getElementById("modalTitle"),
  themeColor: document.getElementById("themeColor"),
  imei1: document.getElementById("imei1Value"),
  imei2: document.getElementById("imei2Value"),
  sn: document.getElementById("snValue"),
  imei1Barcode: document.getElementById("imei1Barcode"),
  imei2Barcode: document.getElementById("imei2Barcode"),
  snBarcode: document.getElementById("snBarcode")
};

function detectPlatform() {
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isIphone = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  state.isAndroid = isAndroid;
  document.body.classList.toggle("android", isAndroid);
  document.body.classList.toggle("ios", isIphone || !isAndroid);
  elements.modalTitle.textContent = isAndroid ? "IMEI_IMEI" : "Información del dispositivo";
  updateAppTheme();
}

function updateAppTheme() {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.body.classList.toggle("dark", prefersDark);

  const theme = state.isAndroid || prefersDark ? "#000000" : "#f8f8f8";
  elements.themeColor?.setAttribute("content", theme);
}

function formatDialedValue(value) {
  return value.length > MAX_VISIBLE_LENGTH ? value.slice(-MAX_VISIBLE_LENGTH) : value;
}

function updateDisplay() {
  elements.display.textContent = formatDialedValue(state.entered);
  elements.display.classList.toggle("has-value", state.entered.length > 0);
  elements.deleteButton.classList.toggle("is-visible", state.entered.length > 0);
}

function hapticTap() {
  if ("vibrate" in navigator) {
    navigator.vibrate(12);
  }
}

function pulseKey(key) {
  const button = document.querySelector(`[data-key="${CSS.escape(key)}"]`);
  if (!button) return;
  button.classList.add("is-pressed");
  window.setTimeout(() => button.classList.remove("is-pressed"), 110);
}

function applyDeviceData(data = {}) {
  state.device = {
    imei1: data.imei1 || data.IMEI1 || data.imei_1 || "--",
    imei2: data.imei2 || data.IMEI2 || data.imei_2 || "--",
    sn: data.sn || data.SN || data.serialNumber || data.serial || "--"
  };

  elements.imei1.textContent = state.device.imei1;
  elements.imei2.textContent = state.device.imei2;
  elements.sn.textContent = state.device.sn;
  renderBarcode(elements.imei1Barcode, state.device.imei1);
  renderBarcode(elements.imei2Barcode, state.device.imei2);
  renderBarcode(elements.snBarcode, state.device.sn);
}

function renderBarcode(element, value) {
  if (!element) return;
  const source = String(value || "--");
  const seed = Array.from(source).reduce((total, char) => total + char.charCodeAt(0), 0);
  let cursor = 0;
  const stops = [];

  for (let index = 0; index < 34; index += 1) {
    const width = ((seed + index * 7) % 3) + 1;
    const gap = ((seed + index * 5) % 2) + 1;
    const alpha = 0.34 + (((seed + index * 11) % 5) / 10);
    stops.push(`rgba(32, 39, 64, ${alpha}) ${cursor}px ${cursor + width}px`);
    cursor += width;
    stops.push(`rgba(255, 255, 255, 0.2) ${cursor}px ${cursor + gap}px`);
    cursor += gap;
  }

  element.style.backgroundImage = `linear-gradient(90deg, ${stops.join(", ")})`;
}

async function requestFullscreenShell() {
  const root = document.documentElement;
  if (!document.fullscreenElement && root.requestFullscreen) {
    try {
      await root.requestFullscreen({ navigationUI: "hide" });
    } catch {
      // Some mobile browsers only allow standalone PWA chrome hiding through the manifest.
    }
  }
}

function openModal() {
  applyDeviceData(state.device);
  elements.modal.classList.add("is-open");
  elements.modal.setAttribute("aria-hidden", "false");
}

function closeModal() {
  elements.modal.classList.remove("is-open");
  elements.modal.setAttribute("aria-hidden", "true");
}

function handleKey(key) {
  requestFullscreenShell();
  hapticTap();
  pulseKey(key);
  state.entered += key;
  updateDisplay();

  if (state.entered.endsWith(TRIGGER_CODE)) {
    window.setTimeout(openModal, 140);
  }
}

function handleDelete() {
  hapticTap();
  state.entered = state.entered.slice(0, -1);
  updateDisplay();
}

function listenForDeviceMetadata() {
  const firebaseBridge = window.systemDialerFirebase;

  if (!firebaseBridge || !firebaseBridge.enabled) {
    const cached = localStorage.getItem("systemDialerDeviceMetadata");
    if (cached) {
      try {
        applyDeviceData(JSON.parse(cached));
      } catch {
        applyDeviceData();
      }
    }
    return;
  }

  state.unsubscribe = firebaseBridge.docRef.onSnapshot(
    (snapshot) => {
      if (!snapshot.exists) {
        applyDeviceData();
        return;
      }
      applyDeviceData(snapshot.data());
    },
    () => applyDeviceData()
  );
}

function bindEvents() {
  document.querySelectorAll("[data-key]").forEach((button) => {
    button.addEventListener("click", () => handleKey(button.dataset.key));
  });

  document.body.addEventListener("pointerdown", requestFullscreenShell, { once: true });

  elements.deleteButton.addEventListener("click", handleDelete);

  document.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  document.addEventListener("keydown", (event) => {
    const allowed = "0123456789*#";
    if (allowed.includes(event.key)) {
      handleKey(event.key);
    }

    if (event.key === "Backspace") {
      handleDelete();
    }

    if (event.key === "Escape") {
      closeModal();
    }
  });

  window.addEventListener("beforeunload", () => {
    if (state.unsubscribe) {
      state.unsubscribe();
    }
  });

  const colorSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  if (colorSchemeQuery.addEventListener) {
    colorSchemeQuery.addEventListener("change", updateAppTheme);
  } else if (colorSchemeQuery.addListener) {
    colorSchemeQuery.addListener(updateAppTheme);
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  }
}

detectPlatform();
applyDeviceData();
listenForDeviceMetadata();
bindEvents();
updateDisplay();
registerServiceWorker();
