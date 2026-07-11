// =========================================================
// Корзина: хранится в браузере (sessionStorage), пока
// пользователь не оформит заказ. Заказ уходит в Firestore.
// =========================================================

const CART_KEY = "stolyarnya_cart";

function getCart() {
  try {
    return JSON.parse(sessionStorage.getItem(CART_KEY)) || [];
  } catch (e) {
    return [];
  }
}

function saveCart(cart) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  saveCart(cart);
  renderCartDrawer();
  openCart();
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    removeFromCart(id);
    return;
  }
  saveCart(cart);
  renderCartDrawer();
}

function removeFromCart(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCartDrawer();
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + (i.price || 0) * i.qty, 0);
}

function updateCartBadge() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  const badge = document.getElementById("cart-count");
  if (!badge) return;
  badge.textContent = count;
  badge.style.display = count > 0 ? "flex" : "none";
}

// --- Отрисовка корзины ---
function renderCartDrawer() {
  const cart = getCart();
  const itemsEl = document.getElementById("cart-items");
  const footerEl = document.getElementById("cart-footer");

  if (cart.length === 0) {
    itemsEl.innerHTML = `<div class="cart-empty">Кошик порожній</div>`;
    footerEl.style.display = "none";
    return;
  }

  footerEl.style.display = "block";
  itemsEl.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.imageUrl || 'images/placeholder.jpg'}" alt="${item.name}">
      <div class="info">
        <div class="name">${item.name}</div>
        <div class="price">${item.price ? item.price + " грн × " + item.qty : "ціна за запитом"}</div>
        <div class="qty-controls">
          <button onclick="changeQty('${item.id}', -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty('${item.id}', 1)">+</button>
        </div>
        <button class="remove-item" onclick="removeFromCart('${item.id}')">Видалити</button>
      </div>
    </div>
  `).join("");

  document.getElementById("cart-total-amount").textContent = cartTotal() + " грн";
}

function openCart() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("overlay").classList.add("open");
}

function closeCart() {
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("overlay").classList.remove("open");
}

// --- Оформление заказа ---
function openCheckout() {
  if (getCart().length === 0) return;
  closeCart();
  renderCheckoutSummary();
  document.getElementById("checkout-modal").classList.add("open");
}

function closeCheckout() {
  document.getElementById("checkout-modal").classList.remove("open");
}

function renderCheckoutSummary() {
  const cart = getCart();
  const summaryEl = document.getElementById("checkout-summary");
  const lines = cart.map(i => `
    <div class="line"><span>${i.name} × ${i.qty}</span><span>${(i.price || 0) * i.qty} грн</span></div>
  `).join("");
  summaryEl.innerHTML = lines + `
    <div class="line total-line"><span>Разом</span><span>${cartTotal()} грн</span></div>
  `;
}

async function submitOrder(e) {
  e.preventDefault();
  const cart = getCart();
  if (cart.length === 0) return;

  const name = document.getElementById("o-name").value.trim();
  const phone = document.getElementById("o-phone").value.trim();
  const city = document.getElementById("o-city").value.trim();
  const branch = document.getElementById("o-branch").value.trim();
  const comment = document.getElementById("o-comment").value.trim();

  const submitBtn = document.getElementById("checkout-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "Відправка...";

  try {
    await db.collection("orders").add({
      items: cart.map(i => ({ id: i.id, name: i.name, price: i.price || 0, qty: i.qty })),
      total: cartTotal(),
      name, phone, city, branch, comment,
      status: "new",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    saveCart([]);
    document.getElementById("checkout-form").style.display = "none";
    document.getElementById("checkout-success").style.display = "block";
  } catch (err) {
    console.error(err);
    alert("Не вдалося відправити замовлення. Перевірте підключення і спробуйте ще раз.");
    submitBtn.disabled = false;
    submitBtn.textContent = "Підтвердити замовлення";
  }
}

function resetCheckout() {
  document.getElementById("checkout-form").reset();
  document.getElementById("checkout-form").style.display = "flex";
  document.getElementById("checkout-success").style.display = "none";
  const submitBtn = document.getElementById("checkout-submit");
  submitBtn.disabled = false;
  submitBtn.textContent = "Підтвердити замовлення";
  closeCheckout();
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  renderCartDrawer();

  document.getElementById("cart-btn").addEventListener("click", openCart);
  document.getElementById("cart-close").addEventListener("click", closeCart);
  document.getElementById("overlay").addEventListener("click", () => { closeCart(); closeCheckout(); });
  document.getElementById("checkout-open").addEventListener("click", openCheckout);
  document.getElementById("checkout-close").addEventListener("click", resetCheckout);
  document.getElementById("checkout-form").addEventListener("submit", submitOrder);
});
