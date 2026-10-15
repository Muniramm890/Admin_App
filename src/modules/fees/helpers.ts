// FILE: teacher-app/src/modules/fees/helpers.ts
// Source: admin App.tsx -> rupees [14209-14209], toPaise [14210-14210], PAYMENT_METHODS [14212-14212], RAZORPAY_METHODS [14213-14213], loadRazorpayScript [14215-14222], loadCashfreeScript [14225-14232], CASHFREE_MODE [14234-14234]
// @ts-nocheck

// ═══════════════════════════════════════════════════════════════
// MODULE: FEE MANAGEMENT
// ═══════════════════════════════════════════════════════════════

export const rupees = (paise) => `₹${((paise || 0) / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export const toPaise = (rupeeStr) => Math.round((parseFloat(rupeeStr) || 0) * 100);

export const PAYMENT_METHODS = ["Cash", "UPI", "Card", "Bank Transfer", "Cheque"];

export const RAZORPAY_METHODS = ["UPI", "Card"];

export const loadRazorpayScript = () => new Promise((resolve) => {
  if (window.Razorpay) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

// 🔴 NEW: Cashfree checkout SDK loader
export const loadCashfreeScript = () => new Promise((resolve) => {
  if (window.Cashfree) return resolve(true);
  const script = document.createElement("script");
  script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

// Change to "production" once you're live with real Cashfree keys.
export const CASHFREE_MODE = "production";
