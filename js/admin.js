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

// --- Список товаров в админке + удаление ---
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
