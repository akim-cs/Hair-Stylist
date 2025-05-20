const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./reviews.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Create reviews table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Fetch all reviews
app.get('/api/reviews', (req, res) => {
  db.all(`SELECT * FROM reviews ORDER BY created_at DESC`, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Submit a new review
app.post('/api/reviews', (req, res) => {
  const { name, rating, comment } = req.body;
  if (!name || !rating || !comment) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  db.run(`INSERT INTO reviews (name, rating, comment) VALUES (?, ?, ?)`,
    [name, rating, comment],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    });
});

// Delete a review (developer access only)
app.delete('/api/reviews/:id', (req, res) => {
  // In a production app, you'd want to add authentication here
  // to ensure only admin/developers can delete reviews
  const reviewId = req.params.id;
  
  db.run(`DELETE FROM reviews WHERE id = ?`, reviewId, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: 'Review not found' });
    res.json({ success: true, message: `Review ${reviewId} deleted successfully` });
  });
});

// Optional: Add a route to get a single review if needed
app.get('/api/reviews/:id', (req, res) => {
  const reviewId = req.params.id;
  
  db.get(`SELECT * FROM reviews WHERE id = ?`, reviewId, (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: 'Review not found' });
    res.json(row);
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
