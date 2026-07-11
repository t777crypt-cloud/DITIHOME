// =========================================================
// Логика админ-панели: вход, добавление и удаление товаров
// =========================================================

const loginBox = document.getElementById("login-box");
const panel = document.getElementById("admin-panel");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const logoutBtn = document.getElementById("logout-btn");

const productForm = document.getElementById("product-form");
const statusMsg = document.getElementById("status-msg");
const adminList = document.getElementById("admin-product-list");

// --- Вход ---
auth.onAuthStateChanged(user => {
  if (user) {
    loginBox.style.display = "none";
    panel.style.display = "block";
    loadAdminList();
    loadOrders();
  } else {
    loginBox.style.display = "block";
    panel.style.display = "none";
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;
  loginError.textContent = "";
  try {
    await auth.signInWithEmailAndPassword(email, pass);
  } catch (err) {
    loginError.textContent = "Невірний email або пароль";
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

// --- Добавление товара ---
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  statusMsg.textContent = "Завантаження...";
  statusMsg.className = "status-msg";

  const name = document.getElementById("p-name").value.trim();
  const price = document.getElementById("p-price").value.trim();
  const material = document.getElementById("p-material").value.trim();
  const size = document.getElementById("p-size").value.trim();
  const fileInput = document.getElementById("p-photo");
  const file = fileInput.files[0];

  if (!name || !file) {
    statusMsg.textContent = "Вкажіть назву товару і фото";
    statusMsg.className = "status-msg err";
    return;
  }

  try {
    // 1. Загружаем фото в Storage
    const fileRef = storage.ref().child(`products/${Date.now()}_${file.name}`);
    await fileRef.put(file);
    const imageUrl = await fileRef.getDownloadURL();

    // 2. Записываем товар в Firestore
    await db.collection("products").add({
      name,
      price: price ? Number(price) : null,
      material,
      size,
      imageUrl,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    statusMsg.textContent = "Товар додано ✓";
    statusMsg.className = "status-msg ok";
    productForm.reset();
    loadAdminList();
  } catch (err) {
    console.error(err);
    statusMsg.textContent = "Помилка. Перевірте налаштування Firebase.";
    statusMsg.className = "status-msg err";
  }
});

// --- Вкладки ---
function showTab(tab) {
  document.getElementById("tab-products").classList.toggle("active", tab === "products");
  document.getElementById("tab-orders").classList.toggle("active", tab === "orders");
  document.getElementById("products-panel").style.display = tab === "products" ? "block" : "none";
  document.getElementById("orders-panel").style.display = tab === "orders" ? "block" : "none";
  if (tab === "orders") loadOrders();
}

// --- Заказы ---
async function loadOrders() {
  const listEl = document.getElementById("orders-list");
  listEl.innerHTML = "Завантаження...";

  const snapshot = await db.collection("orders").orderBy("createdAt", "desc").get();

  if (snapshot.empty) {
    listEl.innerHTML = "<p>Замовлень ще немає.</p>";
    document.getElementById("orders-badge").textContent = "";
    return;
  }

  let newCount = 0;
  let html = "";
  snapshot.forEach(doc => {
    const o = doc.data();
    if (o.status === "new") newCount++;
    const itemsText = (o.items || []).map(i => `${i.name} ×${i.qty}`).join(", ");
    const date = o.createdAt ? o.createdAt.toDate().toLocaleString("uk-UA") : "";
    html += `
      <div class="order-card">
        <div class="order-top">
          <span class="order-id">${date}</span>
          <span class="order-status ${o.status === 'done' ? 'done' : ''}">${o.status === 'done' ? 'Виконано' : 'Нове'}</span>
        </div>
        <div class="order-contact">
          <strong>${o.name}</strong> · ${o.phone}<br>
          ${o.city ? o.city + (o.branch ? ", відділення " + o.branch : "") : ""}
          ${o.comment ? "<br>Коментар: " + o.comment : ""}
        </div>
        <div class="order-items">${itemsText} — разом ${o.total} грн</div>
        <div class="order-actions">
          ${o.status !== 'done' ? `<button class="mark-done" data-id="${doc.id}">Позначити виконаним</button>` : ""}
          <button class="delete-order" data-id="${doc.id}">Видалити</button>
        </div>
      </div>
    `;
  });
  listEl.innerHTML = html;
  document.getElementById("orders-badge").textContent = newCount > 0 ? `(${newCount})` : "";

  listEl.querySelectorAll(".mark-done").forEach(btn => {
    btn.addEventListener("click", async () => {
      await db.collection("orders").doc(btn.dataset.id).update({ status: "done" });
      loadOrders();
    });
  });

  listEl.querySelectorAll(".delete-order").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Видалити це замовлення?")) return;
      await db.collection("orders").doc(btn.dataset.id).delete();
      loadOrders();
    });
  });
}
async function loadAdminList() {
  adminList.innerHTML = "Завантаження...";
  const snapshot = await db.collection("products").orderBy("createdAt", "desc").get();

  if (snapshot.empty) {
    adminList.innerHTML = "<p>Товарів ще немає.</p>";
    return;
  }

  let html = "";
  snapshot.forEach(doc => {
    const p = doc.data();
    html += `
      <div class="admin-row">
        <img src="${p.imageUrl}" alt="${p.name}">
        <div class="info">
          <div class="name">${p.name}</div>
          <div class="price">${p.price ? p.price + " грн" : "без ціни"}</div>
        </div>
        <button class="delete-btn" data-id="${doc.id}">Видалити</button>
      </div>
    `;
  });
  adminList.innerHTML = html;

  adminList.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Видалити цей товар?")) return;
      await db.collection("products").doc(btn.dataset.id).delete();
      loadAdminList();
    });
  });
}
