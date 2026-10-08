"use strict";

const { toCents, fromCents, percentOf } = require("./money");

function evaluateCoupon(coupon) {
  if (!coupon || coupon.active === false) {
    return { ok: false, message: "Cupom inválido." };
  }
  return { ok: true };
}

function couponBenefit(subtotal, coupon) {
  if (!coupon) return 0;

  if (coupon.type === "percent") {
    return percentOf(subtotal, coupon.value);
  }

  if (coupon.type === "fixed") {
    const benefitCents = toCents(coupon.value);
    const subtotalCents = toCents(subtotal);
    return fromCents(Math.min(benefitCents, subtotalCents));
  }

  return 0;
}

module.exports = {
  evaluateCoupon,
  couponBenefit,
};
