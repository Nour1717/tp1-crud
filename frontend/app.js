const API = 'http://localhost:3000/api/products';
const CATEGORIES = ['Visage', 'Corps', 'Cheveux', 'Solaire', 'Bébé & Maman', 'Compléments', 'Hygiène', 'Maquillage', 'Autre'];
const ICONS = { 'Visage':'🧴','Corps':'🧼','Cheveux':'💇','Solaire':'☀️','Bébé & Maman':'🍼','Compléments':'💊','Hygiène':'🪥','Maquillage':'💄','Autre':'🛍️' };

let products = [];
let currentCat = 'Tous';
let currentBrand = '';
let cart = JSON.parse(localStorage.getItem('cart') || '[]');

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dt = (n) => Number(n).toFixed(3);
const isPromo = (p) => p.old_price && Number(p.old_price) > Number(p.price);
const pct = (p) => Math.round((1 - Number(p.price) / Number(p.old_price)) * 100);

/* ---------- Navigation ---------- */
function showView(v) {
  $('view-shop').hidden = v !== 'shop';
  $('view-admin').hidden = v !== 'admin';
  if (v === 'shop') renderShop();
  window.scrollTo(0, 0);
}
function goHome() { currentCat = 'Tous'; currentBrand = ''; $('search').value = ''; renderCategories(); showView('shop'); }
function setCat(c) { currentCat = c; currentBrand = ''; $('search').value = ''; renderCategories(); showView('shop'); }
function setBrand(b) { currentBrand = b; currentCat = 'Tous'; $('search').value = ''; renderCategories(); showView('shop'); }
function scrollToFlash() { $('flash-section').scrollIntoView({ behavior: 'smooth' }); }

/* ---------- Chargement (READ) ---------- */
async function loadProducts() {
  try {
    products = await (await fetch(API)).json();
    renderShop();
    renderAdminList();
    renderCart();
  } catch {
    $('grid').innerHTML = "<p class='empty'>Impossible de contacter l'API (backend démarré ?)</p>";
  }
}

/* ---------- Boutique ---------- */
function renderCategories() {
  $('categories').innerHTML = ['Tous', ...CATEGORIES].map(c =>
    `<li class="${c === currentCat && !currentBrand ? 'active' : ''}" onclick="${c === 'Tous' ? 'goHome()' : `setCat('${c}')`}">${c === 'Tous' ? '🏠' : ICONS[c]} ${c}</li>`).join('');
  $('category').innerHTML = CATEGORIES.map(c => `<option>${c}</option>`).join('');
}

function cardHTML(p) {
  const icon = ICONS[p.category] || '🛍️';
  const promo = isPromo(p);
  const badge = p.quantity <= 0 ? '<span class="badge out">Rupture</span>'
    : promo ? `<span class="badge promo">-${pct(p)}%</span>`
    : '';
  const low = p.quantity > 0 && p.quantity <= 5 ? `<span class="badge low">Plus que ${p.quantity}</span>` : '';
  const img = p.image_url
    ? `<img src="${esc(p.image_url)}" alt="" onclick="showDetails(${p.id})" onerror="this.outerHTML='<div class=ph>${icon}</div>'">`
    : `<div class="ph" onclick="showDetails(${p.id})">${icon}</div>`;
  return `
  <div class="product">
    <div class="imgwrap">${img}${badge}${low}</div>
    <div class="brand">${esc(p.brand) || '&nbsp;'}</div>
    <div class="pname">${esc(p.name)}</div>
    <div class="buy">
      <div class="price ${promo ? 'sale' : ''}">${promo ? `<s>${dt(p.old_price)} DT</s>` : ''}${dt(p.price)} <small>DT</small></div>
      <button class="add" title="Ajouter au panier" onclick="addToCart(${p.id})" ${p.quantity > 0 ? '' : 'disabled'}>+</button>
    </div>
  </div>`;
}

function renderShop() {
  const q = $('search').value.toLowerCase().trim();
  const isHome = currentCat === 'Tous' && !currentBrand && !q;

  // Sections "accueil" visibles seulement sans filtre
  $('home-top').hidden = !isHome;
  if (isHome) { renderFlash(); renderTiles(); renderBrands(); }

  let list = products.filter(p =>
    (currentCat === 'Tous' || p.category === currentCat) &&
    (!currentBrand || p.brand === currentBrand) &&
    (p.name + ' ' + (p.brand || '')).toLowerCase().includes(q));

  const sort = $('sort').value;
  if (sort === 'asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'az') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'promo') list.sort((a, b) => isPromo(b) - isPromo(a));

  $('shop-title').textContent = q ? `Résultats pour « ${$('search').value} »`
    : currentBrand ? currentBrand
    : currentCat === 'Tous' ? 'Tous les produits' : currentCat;
  $('grid').innerHTML = list.map(cardHTML).join('') || '<p class="empty">Aucun produit trouvé.</p>';
}
$('search').addEventListener('input', () => { currentCat = 'Tous'; currentBrand = ''; renderCategories(); showView('shop'); });
$('search').addEventListener('keydown', (e) => { if (e.key === 'Enter') showView('shop'); });

function renderFlash() {
  const promos = products.filter(p => isPromo(p) && p.quantity > 0);
  $('flash-section').hidden = promos.length === 0;
  $('flash-row').innerHTML = promos.map(cardHTML).join('');
}
function renderTiles() {
  $('tiles').innerHTML = CATEGORIES.filter(c => c !== 'Autre').map(c => {
    const n = products.filter(p => p.category === c).length;
    return `<div class="tile" onclick="setCat('${c}')"><span class="ico">${ICONS[c]}</span><b>${c}</b><small>${n} produit${n > 1 ? 's' : ''}</small></div>`;
  }).join('');
}
function renderBrands() {
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))].sort();
  $('brands').innerHTML = brands.map(b => `<span class="brand-chip" data-b="${esc(b)}" onclick="setBrand(this.dataset.b)">${esc(b)}</span>`).join('')
    || '<p class="empty">Ajoute des marques dans Administration.</p>';
}

/* ---------- Slider + compte à rebours ---------- */
let slideIdx = 0;
function showSlide(i) {
  const slides = document.querySelectorAll('.slide'), dots = document.querySelectorAll('.dots span');
  slideIdx = (i + slides.length) % slides.length;
  slides.forEach((s, k) => s.classList.toggle('active', k === slideIdx));
  dots.forEach((d, k) => d.classList.toggle('on', k === slideIdx));
}
setInterval(() => showSlide(slideIdx + 1), 5000);

function tick() {
  const now = new Date(), end = new Date(now); end.setHours(23, 59, 59, 999);
  const s = Math.floor((end - now) / 1000), pad = (n) => String(n).padStart(2, '0');
  $('countdown').textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s % 3600 / 60))}:${pad(s % 60)}`;
}
setInterval(tick, 1000); tick();

/* ---------- Panier ---------- */
function toast(msg) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.hidden = true, 1800);
}
function saveCart() { localStorage.setItem('cart', JSON.stringify(cart)); renderCart(); }
function addToCart(id) {
  const p = products.find(x => x.id === id);
  const item = cart.find(i => i.id === id);
  if (item) { if (item.qty < p.quantity) item.qty++; } else cart.push({ id, qty: 1 });
  saveCart();
  toast('✅ ' + p.name + ' ajouté au panier');
}
function changeQty(id, d) {
  const item = cart.find(i => i.id === id);
  const p = products.find(x => x.id === id);
  item.qty += d;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  else if (p && item.qty > p.quantity) item.qty = p.quantity;
  saveCart();
}
function renderCart() {
  let total = 0;
  $('cart-items').innerHTML = cart.map(i => {
    const p = products.find(x => x.id === i.id);
    if (!p) return '';
    total += p.price * i.qty;
    return `<div class="cart-item"><span>${esc(p.name)}</span>
      <span class="qty"><button onclick="changeQty(${i.id},-1)">−</button> ${i.qty} <button onclick="changeQty(${i.id},1)">+</button></span></div>`;
  }).join('') || '<p>Panier vide</p>';
  $('cart-total').textContent = dt(total);
  $('cart-count').textContent = cart.reduce((s, i) => s + i.qty, 0);
}
function toggleCart() { $('cart').hidden = !$('cart').hidden; }
function checkout() {
  if (!cart.length) return alert('Panier vide');
  alert("Merci ! Commande simulée (le paiement n'est pas dans le périmètre du TP).");
  cart = []; saveCart(); toggleCart();
}
function subscribe() {
  const e = $('nl-email');
  if (!e.value.includes('@')) return toast('⚠️ Entre une adresse e-mail valide');
  e.value = ''; toast('💌 Merci pour votre inscription !');
}

/* ---------- Administration (CRUD) ---------- */
function renderAdminList() {
  $('product-list').innerHTML = products.map(p => `
    <tr>
      <td>${p.id}</td><td>${esc(p.name)}</td><td>${esc(p.category)}</td>
      <td>${dt(p.price)} DT</td><td>${p.old_price ? dt(p.old_price) + ' DT' : '—'}</td><td>${p.quantity}</td>
      <td class="actions">
        <button onclick="showDetails(${p.id})">Voir</button>
        <button class="secondary" onclick="editProduct(${p.id})">Modifier</button>
        <button class="danger" onclick="deleteProduct(${p.id})">Supprimer</button>
      </td>
    </tr>`).join('') || '<tr><td colspan="7">Aucun produit</td></tr>';
}

$('product-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('message').textContent = '';
  const id = $('product-id').value;
  const body = {
    name: $('name').value, brand: $('brand').value, category: $('category').value,
    price: $('price').value, old_price: $('old_price').value, quantity: $('quantity').value || 0,
    image_url: $('image_url').value, description: $('description').value,
  };
  const res = await fetch(id ? `${API}/${id}` : API, {
    method: id ? 'PUT' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { $('message').textContent = (await res.json()).error; return; }
  resetForm();
  loadProducts();
});

async function showDetails(id) {
  const p = await (await fetch(`${API}/${id}`)).json();
  $('details-content').innerHTML = `
    ${p.image_url ? `<img src="${esc(p.image_url)}" alt="">` : ''}
    <h3>${esc(p.name)}</h3>
    <p><b>Marque :</b> ${esc(p.brand)} • <b>Catégorie :</b> ${esc(p.category)}</p>
    <p>${esc(p.description)}</p>
    <p><b>Prix :</b> ${dt(p.price)} DT ${isPromo(p) ? `<s>${dt(p.old_price)} DT</s> <b style="color:#e11d48">-${pct(p)}%</b>` : ''}<br><b>Stock :</b> ${p.quantity}</p>
    <p><small>ID ${p.id} — créé le ${new Date(p.created_at).toLocaleString('fr-FR')}</small></p>`;
  $('details').hidden = false;
}

async function editProduct(id) {
  const p = await (await fetch(`${API}/${id}`)).json();
  $('product-id').value = p.id;
  $('name').value = p.name; $('brand').value = p.brand || '';
  $('category').value = p.category; $('price').value = p.price;
  $('old_price').value = p.old_price || '';
  $('quantity').value = p.quantity; $('image_url').value = p.image_url || '';
  $('description').value = p.description || '';
  $('form-title').textContent = 'Modifier le produit';
  $('submit-btn').textContent = 'Enregistrer';
  $('cancel-btn').hidden = false;
  window.scrollTo(0, 0);
}

async function deleteProduct(id) {
  if (!confirm('Supprimer ce produit ?')) return;
  await fetch(`${API}/${id}`, { method: 'DELETE' });
  loadProducts();
}

function resetForm() {
  $('product-form').reset();
  $('product-id').value = '';
  $('form-title').textContent = 'Ajouter un produit';
  $('submit-btn').textContent = 'Ajouter';
  $('cancel-btn').hidden = true;
}
$('cancel-btn').addEventListener('click', resetForm);

/* ---------- Démarrage ---------- */
renderCategories();
renderCart();
loadProducts();
