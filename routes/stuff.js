const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const stuffCtrl = require('../controllers/stuff');

// GET
router.get('/', stuffCtrl.getAllBooks);
router.get('/bestrating', stuffCtrl.getBestRatedBooks);
router.get('/:id', stuffCtrl.getOneBook);

// POST
router.post('/', auth, multer, stuffCtrl.createBook);
router.post('/:id/rating', auth, stuffCtrl.rateBook);

// PUT
router.put('/:id', auth, multer, stuffCtrl.modifyBook);

// DELETE
router.delete('/:id', auth, stuffCtrl.deleteBook);

module.exports = router;