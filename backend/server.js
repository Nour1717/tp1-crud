const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'tp1user',
  password: process.env.DB_PASSWORD || 'tp1pass',
  database: process.env.DB_NAME || 'tp1db',
});

// Création / mise à jour automatique de la table
(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'Autre'`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS brand VARCHAR(50) DEFAULT ''`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT ''`);
    await pool.query(`ALTER TABLE products ADD COLUMN IF NOT EXISTS old_price NUMERIC(10,2)`);
    console.log('Table products prête');
  } catch (e) { console.error('Erreur DB :', e.message); }
})();

function validate(body) {
  const { name, price, quantity } = body;
  if (!name || String(name).trim() === '') return 'Le nom est obligatoire';
  if (price === undefined || price === '' || isNaN(price) || Number(price) < 0) return 'Prix invalide';
  if (quantity !== undefined && quantity !== '' && (!Number.isInteger(Number(quantity)) || Number(quantity) < 0)) return 'Quantité invalide';
  const op = body.old_price;
  if (op !== undefined && op !== null && op !== '' && (isNaN(op) || Number(op) < 0)) return 'Ancien prix invalide';
  return null;
}

const values = (b) => [
  b.name.trim(), b.description || '', b.price, b.quantity || 0,
  b.category || 'Autre', b.brand || '', b.image_url || '',
  (b.old_price === undefined || b.old_price === null || b.old_price === '') ? null : b.old_price,
];

// CREATE
app.post('/api/products', async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const r = await pool.query(
      `INSERT INTO products (name, description, price, quantity, category, brand, image_url, old_price)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, values(req.body));
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// READ (liste)
app.get('/api/products', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// READ (un produit)
app.get('/api/products/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM products WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// UPDATE
app.put('/api/products/:id', async (req, res) => {
  const err = validate(req.body);
  if (err) return res.status(400).json({ error: err });
  try {
    const r = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, quantity=$4,
       category=$5, brand=$6, image_url=$7, old_price=$8 WHERE id=$9 RETURNING *`,
      [...values(req.body), req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE
app.delete('/api/products/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json({ message: 'Produit supprimé' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API sur http://localhost:${PORT}`));
