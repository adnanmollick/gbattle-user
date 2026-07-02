import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Global performance styles
const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after {
    box-sizing: border-box;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  * { margin: 0; padding: 0; }
  body {
    background: #06040f;
    overscroll-behavior: none;
    overflow-x: hidden;
    touch-action: pan-y;
  }
  ::-webkit-scrollbar { display: none; }
  
  /* GPU acceleration for all animated elements */
  button, a, [data-animate] {
    will-change: transform;
    transform: translateZ(0);
    backface-visibility: hidden;
  }
  
  /* Smooth scroll */
  html { scroll-behavior: smooth; }
  
  /* Input focus glow */
  input:focus, textarea:focus {
    border-color: rgba(167,139,250,0.6) !important;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.15) !important;
    outline: none !important;
  }

  /* Page transition */
  .page-enter {
    animation: pageIn 0.25s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  }
  @keyframes pageIn {
    from { opacity: 0; transform: translateY(12px) scale(0.99); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* Button press effect */
  button:active { transform: scale(0.96) translateZ(0) !important; }

  /* Card hover */
  .match-card { transition: transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.18s ease; }
  .match-card:active { transform: scale(0.98) translateZ(0) !important; }

  /* Shimmer */
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Bounce dot */
  @keyframes dot {
    0%, 100% { opacity: 0.3; transform: scale(0.8) translateZ(0); }
    50%       { opacity: 1;   transform: scale(1.2) translateZ(0); }
  }

  /* Pulse */
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }

  /* Spin */
  @keyframes spin { to { transform: rotate(360deg) translateZ(0); } }

  /* Float particle */
  @keyframes float {
    0%, 100% { transform: translateY(0) translateZ(0); }
    50%       { transform: translateY(-6px) translateZ(0); }
  }

  /* Glow pulse */
  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(167,139,250,0.3); }
    50%       { box-shadow: 0 0 25px rgba(167,139,250,0.7); }
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
