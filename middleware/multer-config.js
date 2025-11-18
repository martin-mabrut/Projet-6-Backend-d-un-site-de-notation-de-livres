// ANCIEN IMPORT : on gardait seulement multer
const multer = require('multer');

// NOUVEL IMPORT : on ajoute sharp pour redimensionner / compresser / convertir en webp
const sharp = require('sharp');


// ANCIEN CODE : on utilisait MIME_TYPES pour choisir l’extension (jpg/png)
/*
const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};
*/
// 👉 Avec la nouvelle version, on convertit tout en .webp,
// donc on n’a plus besoin de MIME_TYPES.


// ANCIEN STOCKAGE : on écrivait directement le fichier sur le disque
/*
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    const bookData = JSON.parse(req.body.book);  
    const name = bookData.title.split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  }
});

module.exports = multer({storage: storage}).single('image');
*/

// 🔁 NOUVEAU STOCKAGE : on garde le fichier en mémoire (buffer),
// pour pouvoir le traiter avec sharp AVANT de l’enregistrer sur le disque.
const storage = multer.memoryStorage(); // ✅ nouveau : plus de diskStorage ici

// On garde un middleware multer de base, mais il ne fait que lire le fichier en mémoire
const upload = multer({ storage: storage }).single('image'); // ✅ nouveau : pas encore d’écriture disque


// ✅ NOUVEAU MIDDLEWARE EXPORTÉ
// Il remplace l’ancien `module.exports = multer({storage}).single('image');`
module.exports = (req, res, next) => {
  // On appelle d’abord multer pour récupérer le fichier dans req.file (en mémoire)
  upload(req, res, async (err) => {
    if (err) {
      // Si multer rencontre un problème (taille, type...), on renvoie une erreur
      return res.status(400).json({ error: err });
    }

    // Si aucune image n’est envoyée, on passe simplement au middleware suivant
    if (!req.file) {
      return next();
    }

    try {
      // On récupère les données du livre pour utiliser le titre dans le nom du fichier
      const bookData = JSON.parse(req.body.book);           // ✅ nouveau : on lit le body pour récupérer title
      const name = bookData.title.split(' ').join('_');     // ✅ nouveau : comme avant, mais ici pour webp

      const filename = name + Date.now() + '.webp';         // ✅ nouveau : on force l’extension .webp
      const outputPath = `images/${filename}`;

      // 🪄 Traitement de l’image avec sharp :
      // - redimensionner à une largeur max de 1000px
      // - convertir en webp
      // - compresser avec quality: 80
      await sharp(req.file.buffer)
        .resize({ width: 1000 })        // ✅ nouveau : réduit si l’image est trop grande
        .webp({ quality: 80 })          // ✅ nouveau : convertit + compresse en webp
        .toFile(outputPath);            // ✅ nouveau : enregistre l’image optimisée dans /images

      // On met à jour filename pour que ton contrôleur puisse construire l’URL comme avant
      req.file.filename = filename;     // ✅ nouveau : important pour imageUrl dans createBook

      // On laisse la main au contrôleur (createBook, etc.)
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors du traitement de l'image" });
    }
  });
};