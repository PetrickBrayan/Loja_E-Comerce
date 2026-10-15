"use strict";

const { isListedInCatalog } = require("../domain/catalog");
const { quoteLines } = require("../domain/pricing");
const { totalsForOrder } = require("../domain/orderTotals");
const { normalizeAddress } = require("../domain/address");
const { hasAvailableStock } = require("../domain/stock");

const recentCheckouts = new Map();
const CHECKOUT_WINDOW_MS = 5000;

function fingerprint(userId, body) {
  const items = (body.items || [])
    .map((item) => `${item.productId}:${item.quantity}:${item.unitPrice ?? ""}`)
    .sort()
    .join(",");
  const address = JSON.stringify(body.address || {});
  return `${userId}|${items}|${body.couponCode || ""}|${address}`;
}

function resolveUnitPrice(product, requested) {
  if (requested !== undefined && requested !== null && requested !== "") {
    const price = Number(requested);
    if (Number.isFinite(price)) return price;
  }
  return Number(product.price);
}

function placeOrder(db, user, body) {
  const key = fingerprint(user.id, body || {});
  const previous = recentCheckouts.get(key);
  if (previous && Date.now() - previous.at < CHECKOUT_WINDOW_MS) {
    return previous.result;
  }

  const itemsInput = Array.isArray(body.items) ? body.items : [];
  const lines = [];

  for (const item of itemsInput) {
    const product = db.findProduct(item.productId);
    if (!isListedInCatalog(product)) {
      return { ok: false, status: 400, error: "Produto não encontrado." };
    }

    const unitPrice = resolveUnitPrice(product, item.unitPrice);
    lines.push({
      productId: product.id,
      name: product.name,
      unitPrice,
      quantity: item.quantity,
    });
  }

  let coupon = null;
  if (body.couponCode) {
    coupon = db.findCoupon(body.couponCode);
    if (!coupon) {
      return { ok: false, status: 400, error: "Cupom inválido." };
    }
  }

  const quote = quoteLines({ lines, coupon });
  if (!quote.ok) {
    return { ok: false, status: 400, error: quote.message };
  }

  // RN-03: a quantidade não pode passar do estoque. Soma por produto (o mesmo
  // produto pode aparecer em mais de uma linha) e valida TUDO antes de alterar qualquer coisa.
  const requested = new Map();
  for (const line of lines) {
    requested.set(line.productId, (requested.get(line.productId) || 0) + Number(line.quantity));
  }
  for (const [productId, quantity] of requested) {
    const product = db.findProduct(productId);
    if (!hasAvailableStock(quantity, product.stock)) {
      return {
        ok: false,
        status: 400,
        error: `Estoque insuficiente para "${product.name}". Disponível: ${product.stock}.`,
      };
    }
  }

  const addressResult = normalizeAddress(body.address);
  const totals = totalsForOrder(quote);
  const order = {
    id: db.nextOrderId(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    items: quote.items,
    subtotal: totals.subtotal,
    discount: totals.discount,
    shipping: totals.shipping,
    total: totals.total,
    couponCode: coupon ? coupon.code : null,
    benefit: quote.benefit,
    address: addressResult.address,
    status: "confirmado",
  };

  // RN-08: reduz o estoque e grava o pedido (só depois de tudo validado).
  for (const [productId, quantity] of requested) {
    const product = db.findProduct(productId);
    db.updateProduct(productId, { stock: product.stock - quantity });
  }
  db.addOrder(order);

  const result = { ok: true, status: 201, order };
  recentCheckouts.set(key, { at: Date.now(), result });
  return result;
}

module.exports = {
  placeOrder,
};