const multer = require('multer');

// On ajoute sharp pour redimensionner / compresser / convertir en webp
const sharp = require('sharp');

// On garde le fichier en mémoire (buffer),
// pour pouvoir le traiter avec sharp AVANT de l’enregistrer sur le disque.
const storage = multer.memoryStorage(); 

// On garde un middleware multer de base, mais il ne fait que lire le fichier en mémoire
const upload = multer({ storage: storage }).single('image'); // pas encore d’écriture disque


module.exports = (req, res, next) => {
  // On appelle d’abord multer pour récupérer le fichier dans req.file (en mémoire)
  upload(req, res, async (err) => {
    if (err) {
      // Si multer rencontre un problème (taille, type...), on renvoie une erreur
      return res.status(400).json({ error: err });
    }

    // Si aucune image n’est envoyée, on passe au middleware suivant
    if (!req.file) {
      return next();
    }

    try {
      // On récupère les données du livre pour utiliser le titre dans le nom du fichier
      const bookData = JSON.parse(req.body.book);           // on lit le body pour récupérer title
      const name = bookData.title.replace(/\s+/g, '_');     // On utilisera le titre du livre (espaces remplacés par _) pour donner un nom au fichier 
      const filename = name + Date.now() + '.webp';         // on force l’extension .webp
      const outputPath = `images/${filename}`;

      // Traitement de l’image avec sharp :
      await sharp(req.file.buffer)
        .resize({ width: 520 })        // réduit si l’image est trop grande
        .webp({ quality: 80 })          // convertit + compresse en webp
        .toFile(outputPath);            // enregistre l’image optimisée dans /images

      // On met à jour filename 
      req.file.filename = filename;     

      // On laisse la main au contrôleur (createBook, etc.)
      next();
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Erreur lors du traitement de l'image" });
    }
  });
};