/* ============================================================
   SAFEVAULT — Toast Notification System
   Drop-in replacement for alert() across all pages
   Usage: toast("Message")  |  toast("Message", "error")
          toast("Message", "success")  |  toast("Message", "warning")
   ============================================================ */

(function () {

  /* ── Inject styles once ── */
  if (!document.getElementById("sv-toast-styles")) {
    const style = document.createElement("style");
    style.id = "sv-toast-styles";
    style.textContent = `
      #sv-toast-container {
        position: fixed;
        top: 24px;
        right: 24px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
      }

      .sv-toast {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        min-width: 300px;
        max-width: 380px;
        padding: 14px 16px;
        border-radius: 12px;
        border: 1px solid;
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 1px 0 rgba(255,255,255,0.05) inset;
        pointer-events: all;
        cursor: default;
        animation: sv-slide-in 0.38s cubic-bezier(0.22, 1, 0.36, 1) both;
        position: relative;
        overflow: hidden;
      }

      .sv-toast.sv-hiding {
        animation: sv-slide-out 0.3s cubic-bezier(0.4, 0, 1, 1) both;
      }

      /* Type variants */
      .sv-toast.success {
        background: rgba(0, 224, 158, 0.08);
        border-color: rgba(0, 224, 158, 0.25);
      }
      .sv-toast.error {
        background: rgba(255, 79, 106, 0.08);
        border-color: rgba(255, 79, 106, 0.25);
      }
      .sv-toast.warning {
        background: rgba(255, 181, 71, 0.08);
        border-color: rgba(255, 181, 71, 0.25);
      }
      .sv-toast.info {
        background: rgba(0, 220, 200, 0.07);
        border-color: rgba(0, 220, 200, 0.2);
      }

      /* Glow top-edge line */
      .sv-toast::before {
        content: "";
        position: absolute;
        top: 0; left: 10%; right: 10%;
        height: 1px;
      }
      .sv-toast.success::before { background: linear-gradient(90deg, transparent, rgba(0,224,158,0.6), transparent); }
      .sv-toast.error::before   { background: linear-gradient(90deg, transparent, rgba(255,79,106,0.6), transparent); }
      .sv-toast.warning::before { background: linear-gradient(90deg, transparent, rgba(255,181,71,0.6), transparent); }
      .sv-toast.info::before    { background: linear-gradient(90deg, transparent, rgba(0,220,200,0.5), transparent); }

      /* Progress bar */
      .sv-toast::after {
        content: "";
        position: absolute;
        bottom: 0; left: 0;
        height: 2px;
        border-radius: 0 0 12px 12px;
        animation: sv-progress var(--sv-duration, 3500ms) linear both;
      }
      .sv-toast.success::after { background: #00e09e; }
      .sv-toast.error::after   { background: #ff4f6a; }
      .sv-toast.warning::after { background: #ffb547; }
      .sv-toast.info::after    { background: #00dcc8; }

      /* Icon */
      .sv-toast-icon {
        font-size: 18px;
        flex-shrink: 0;
        margin-top: 1px;
        filter: drop-shadow(0 0 6px currentColor);
      }

      /* Body */
      .sv-toast-body {
        flex: 1;
        min-width: 0;
      }

      .sv-toast-title {
        font-family: 'JetBrains Mono', monospace;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        margin-bottom: 3px;
      }
      .sv-toast.success .sv-toast-title { color: #00e09e; }
      .sv-toast.error .sv-toast-title   { color: #ff4f6a; }
      .sv-toast.warning .sv-toast-title { color: #ffb547; }
      .sv-toast.info .sv-toast-title    { color: #00dcc8; }

      .sv-toast-msg {
        font-family: 'DM Sans', sans-serif;
        font-size: 13.5px;
        color: #e8eaf6;
        line-height: 1.45;
        word-break: break-word;
      }

      /* Close button */
      .sv-toast-close {
        flex-shrink: 0;
        background: none;
        border: none;
        color: rgba(255,255,255,0.25);
        font-size: 16px;
        cursor: pointer;
        padding: 0 2px;
        line-height: 1;
        transition: color 0.2s;
        margin-top: 1px;
        pointer-events: all;
      }
      .sv-toast-close:hover { color: rgba(255,255,255,0.7); }

      /* Keyframes */
      @keyframes sv-slide-in {
        from { opacity: 0; transform: translateX(40px) scale(0.95); }
        to   { opacity: 1; transform: translateX(0)   scale(1); }
      }
      @keyframes sv-slide-out {
        from { opacity: 1; transform: translateX(0)   scale(1); max-height: 120px; margin-bottom: 0; }
        to   { opacity: 0; transform: translateX(40px) scale(0.93); max-height: 0;   margin-bottom: -10px; }
      }
      @keyframes sv-progress {
        from { width: 100%; }
        to   { width: 0%; }
      }
    `;
    document.head.appendChild(style);
  }

  /* ── Create container once ── */
  function getContainer() {
    let c = document.getElementById("sv-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "sv-toast-container";
      document.body.appendChild(c);
    }
    return c;
  }

  /* ── Config per type ── */
  const CONFIG = {
    success: { icon: "✓",  label: "Success" },
    error:   { icon: "✕",  label: "Error"   },
    warning: { icon: "⚠",  label: "Warning" },
    info:    { icon: "🔐", label: "SafeVault" },
  };

  /* ── Main toast function ── */
  window.toast = function (message, type = "info", duration = 3500) {
    const container = getContainer();
    const cfg = CONFIG[type] || CONFIG.info;

    const el = document.createElement("div");
    el.className = `sv-toast ${type}`;
    el.style.setProperty("--sv-duration", duration + "ms");

    el.innerHTML = `
      <span class="sv-toast-icon">${cfg.icon}</span>
      <div class="sv-toast-body">
        <div class="sv-toast-title">${cfg.label}</div>
        <div class="sv-toast-msg">${message}</div>
      </div>
      <button class="sv-toast-close" aria-label="Dismiss">✕</button>
    `;

    container.appendChild(el);

    /* Dismiss helpers */
    const dismiss = () => {
      el.classList.add("sv-hiding");
      el.addEventListener("animationend", () => el.remove(), { once: true });
    };

    el.querySelector(".sv-toast-close").addEventListener("click", dismiss);

    const timer = setTimeout(dismiss, duration);
    el.addEventListener("mouseenter", () => clearTimeout(timer));
    el.addEventListener("mouseleave", () => setTimeout(dismiss, 800));
  };

})();
