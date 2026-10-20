# TP1 — CRUD Full Stack (WSL2 Ubuntu) — style boutique parapharmacie

Deux vues : **Boutique** (grille de produits, catégories, recherche, panier) et **Administration** (CRUD complet).
Les colonnes category, brand, image_url, old_price (prix avant promo) sont ajoutées automatiquement au démarrage du backend.

Stack : HTML/CSS/JavaScript • Node.js (Express) • PostgreSQL

## 1. Installer les outils (dans WSL2 Ubuntu)
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib nodejs npm
sudo service postgresql start
```

## 2. Créer la base de données
```bash
sudo -u postgres psql <<'SQL'
CREATE USER tp1user WITH PASSWORD 'tp1pass';
CREATE DATABASE tp1db OWNER tp1user;
SQL
```

## 3. Lancer le backend
```bash
cd backend
npm install
npm start          # http://localhost:3000
```

## 4. Lancer le frontend (autre terminal)
```bash
cd frontend
python3 -m http.server 5500   # http://localhost:5500
```
Ouvrir http://localhost:5500 dans le navigateur Windows.

## 5. Tester l'API (curl)
```bash
# Create
curl -X POST localhost:3000/api/products -H "Content-Type: application/json" \
  -d '{"name":"Crème hydratante","brand":"Bioderma","category":"Visage","description":"Peau sèche","price":25.5,"quantity":10}'
# Read (liste)
curl localhost:3000/api/products
# Read (un produit)
curl localhost:3000/api/products/1
# Update
curl -X PUT localhost:3000/api/products/1 -H "Content-Type: application/json" \
  -d '{"name":"Crème hydratante 50ml","brand":"Bioderma","category":"Visage","description":"Peau sèche","price":30,"quantity":8}'
# Delete
curl -X DELETE localhost:3000/api/products/1
```

## 6. Vérifier dans la base
```bash
psql -h localhost -U tp1user -d tp1db -c "SELECT * FROM products;"
```
# tp1-crud
