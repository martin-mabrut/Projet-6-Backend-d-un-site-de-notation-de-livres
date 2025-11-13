const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const stuffCtrl = require('../controllers/stuff');

router.post('/', auth, multer, stuffCtrl.createBook);
router.get('/bestrating', stuffCtrl.getBestRatedBooks);
router.post('/:id/rating', auth, stuffCtrl.rateBook);
router.get('/:id', stuffCtrl.getOneBook);
router.put('/:id', auth, multer, stuffCtrl.modifyBook);
router.delete('/:id', auth, stuffCtrl.deleteBook);
router.get('/', stuffCtrl.getAllBooks);

module.exports = router;