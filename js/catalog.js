// =========================================================
// Загрузка товаров из Firestore и отрисовка каталога
// =========================================================

const grid = document.getElementById("catalog-grid");
const countEl = document.getElementById("catalog-count");
const CONTACT_LINK = "https://t.me/ВАШ_НИК"; // замените на свой Telegram/Viber/номер

function renderEmpty() {
  grid.innerHTML = `
    <div class="empty-state">
      Товарів поки немає.<br>
      Додайте перший товар через сторінку /admin.html
    </div>
  `;
  countEl.textContent = "";
}

function productCard(id, p) {
  const price = p.price ? `${p.price} грн` : "Ціна за запитом";
  const spec = [p.material, p.size].filter(Boolean).join(" · ");
  return `
    <article class="card">
      <div class="card-photo">
        <img src="${p.imageUrl || 'images/placeholder.jpg'}" alt="${p.name}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        ${p.material ? `<div class="card-material">${p.material}</div>` : ""}
        ${spec ? `<div class="card-spec">${spec}</div>` : ""}
        <div class="card-price">${price}</div>
        <a class="card-order" href="${CONTACT_LINK}" target="_blank" rel="noopener">
          Замовити
        </a>
      </div>
    </article>
  `;
}

async function loadCatalog() {
  try {
    const snapshot = await db.collection("products")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      renderEmpty();
      return;
    }

    let html = "";
    snapshot.forEach(doc => {
      html += productCard(doc.id, doc.data());
    });
    grid.innerHTML = html;
    countEl.textContent = `${snapshot.size} товарів`;
  } catch (err) {
    console.error("Помилка завантаження каталогу:", err);
    grid.innerHTML = `<div class="empty-state">Не вдалося завантажити каталог. Перевірте налаштування Firebase у js/firebase-config.js</div>`;
  }
}

loadCatalog();
