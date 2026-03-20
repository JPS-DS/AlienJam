const router = require('express').Router();
const db = require('../db');
const { requireAuth } = require('../auth');

const VALID_SPECIES = ['blob', 'tentacle', 'crystal', 'bug'];
const VALID_ACCESSORIES = ['antenna', 'hat', 'glasses', 'bow', 'crown', 'scarf'];

// GET /api/character — get current user's character
router.get('/', requireAuth, (req, res) => {
  const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(req.userId);
  if (!char) return res.json({ character: null });

  res.json({
    character: {
      ...char,
      accessories: JSON.parse(char.accessories)
    }
  });
});

// POST /api/character — create or update character
router.post('/', requireAuth, (req, res) => {
  const { species, color, accessories = [] } = req.body;

  if (!VALID_SPECIES.includes(species)) {
    return res.status(400).json({ error: `Species must be one of: ${VALID_SPECIES.join(', ')}` });
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: 'Color must be a valid hex color (e.g. #7CFC00)' });
  }
  if (!Array.isArray(accessories) || accessories.some(a => !VALID_ACCESSORIES.includes(a))) {
    return res.status(400).json({ error: `Invalid accessory. Valid options: ${VALID_ACCESSORIES.join(', ')}` });
  }

  const existing = db.prepare('SELECT id FROM characters WHERE user_id = ?').get(req.userId);

  if (existing) {
    db.prepare(`
      UPDATE characters
      SET species = ?, color = ?, accessories = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).run(species, color, JSON.stringify(accessories), req.userId);
  } else {
    db.prepare(`
      INSERT INTO characters (user_id, species, color, accessories)
      VALUES (?, ?, ?, ?)
    `).run(req.userId, species, color, JSON.stringify(accessories));
  }

  const char = db.prepare('SELECT * FROM characters WHERE user_id = ?').get(req.userId);
  res.json({
    character: {
      ...char,
      accessories: JSON.parse(char.accessories)
    }
  });
});

// GET /api/character/pets — get user's pets
router.get('/pets', requireAuth, (req, res) => {
  const pets = db.prepare('SELECT * FROM pets WHERE owner_id = ?').all(req.userId);
  res.json({ pets });
});

// POST /api/character/pets — add a pet
router.post('/pets', requireAuth, (req, res) => {
  const { name, species = 'floaty', color = '#FF69B4' } = req.body;
  if (!name || name.length < 1 || name.length > 20) {
    return res.status(400).json({ error: 'Pet name must be 1–20 characters' });
  }

  const existing = db.prepare('SELECT COUNT(*) as count FROM pets WHERE owner_id = ?').get(req.userId);
  if (existing.count >= 3) {
    return res.status(400).json({ error: 'Maximum 3 pets allowed' });
  }

  const result = db.prepare(
    'INSERT INTO pets (owner_id, name, species, color) VALUES (?, ?, ?, ?)'
  ).run(req.userId, name, species, color);

  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(result.lastInsertRowid);
  res.json({ pet });
});

module.exports = router;
