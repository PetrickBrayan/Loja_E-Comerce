"use strict";

function listVisibleOrders(db, userId) {
  const owned = db.listOrders().filter((order) => order.userId === userId);

  // Soma uma única vez, por produto, quanto o cliente comprou (antes: um laço dentro de outro, O(n²)).
  const soldByProduct = new Map();
  for (const current of owned) {
    for (const candidate of current.items) {
      soldByProduct.set(candidate.productId, (soldByProduct.get(candidate.productId) || 0) + (Number(candidate.quantity) || 0));
    }
  }

  return owned.map((order) => ({
    ...order,
    items: order.items.map((item) => ({ ...item, quantitySoldToCustomer: soldByProduct.get(item.productId) || 0 })),
  }));
}

module.exports = {
  listVisibleOrders,
};
