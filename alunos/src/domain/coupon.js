"use strict";

const { toCents, fromCents, percentOf } = require("./money");

const { now } = require("./clock");


const EXPIRY_OFFSET = "-03:00";

function endOfValidityDay(expiresAt) {
  const day = String(expiresAt).slice(0, 10); // "AAAA-MM-DD", ignora hora e fuso do texto
  return new Date(`${day}T23:59:59.999${EXPIRY_OFFSET}`);
}

function evaluateCoupon(coupon) {
  if (!coupon || coupon.active === false) {
    return { ok: false, message: "Cupom inválido." };
  }
  if (coupon.expiresAt) {
    const end = endOfValidityDay(coupon.expiresAt);
    if (Number.isNaN(end.getTime())) {
      return { ok: false, message: "Cupom inválido." };
    }
    if (now() > end) {
      return { ok: false, message: "Cupom vencido." };
    }
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