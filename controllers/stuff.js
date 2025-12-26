const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
   const bookObject = JSON.parse(req.body.book);
   delete bookObject._id;
   delete bookObject._userId;
   const book = new Book({
       ...bookObject,
       userId: req.auth.userId,
       imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
   });
 
   book.save()
   .then(() => { res.status(201).json({message: 'Objet enregistré !'})})
   .catch(error => { res.status(400).json( { error })})
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
      }
    : { ...req.body };

  delete bookObject._userId;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        return res.status(403).json({ message: 'Unauthorized request' });
      }

      const applyUpdate = () => {
        Book.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: 'Objet modifié!' }))
          .catch(error => res.status(401).json({ error }));
      };

      // S'il n'y a PAS de nouvelle image : on met à jour le livre
      if (!req.file) {
        return applyUpdate();
      }

      // S'il Y A une nouvelle image : on supprime l'ancienne avant de mettre à jour
      const oldFilename = book.imageUrl.split('/images/')[1];
      fs.unlink(`images/${oldFilename}`, (err) => {
        if (err) {
          console.error('Erreur suppression ancienne image :', err);
          // même si la suppression échoue, on met à jour le livre
        }
        applyUpdate();
      });
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBook = (req, res, next) => {
   Book.findOne({ _id: req.params.id})
       .then(book => {
           if (book.userId != req.auth.userId) {
               res.status(403).json({message: 'unauthorized request'});
           } else {
               const filename = book.imageUrl.split('/images/')[1];
               fs.unlink(`images/${filename}`, () => {
                   Book.deleteOne({_id: req.params.id})
                       .then(() => { res.status(200).json({message: 'Objet supprimé !'})})
                       .catch(error => res.status(401).json({ error }));
               });
           }
       })
       .catch( error => {
           res.status(500).json({ error });
       });
};

exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
}

exports.getAllBooks = (req, res, next) => {
  Book.find()
    .then(books => res.status(200).json(books))
    .catch(error => res.status(400).json({ error }));
}

exports.getBestRatedBooks = (req, res, next) => {
  // On cherche tous les livres dans la collection
  Book.find()
    // On les trie par ordre décroissant selon la note moyenne (du plus haut au plus bas)
    .sort({ averageRating: -1 })
    // On limite le résultat à 3 livres maximum
    .limit(3)
    // Si tout se passe bien, on renvoie les livres trouvés
    .then(bestRatedBooks => {
      res.status(200).json(bestRatedBooks);
    })
    // En cas d’erreur (ex : problème de connexion à la base), on renvoie une erreur 500
    .catch(error => {
      res.status(500).json({ error });
    });
};

exports.rateBook = (req, res, next) => {
  const bookId = req.params.id;
  const userId = req.auth.userId; // récupéré du token, donc fiable
  const rating = req.body.rating;

  if (rating < 0 || rating > 5) {
    return res.status(400).json({ message: 'La note doit être comprise entre 0 et 5.' });
  }

  Book.findOne({ _id: bookId })
    .then(book => {
      if (!book) {
        return res.status(404).json({ message: 'Livre introuvable.' });
      }

      const alreadyRated = book.ratings.find(r => r.userId === userId);
      if (alreadyRated) {
        return res.status(400).json({ message: 'Vous avez déjà noté ce livre.' });
      }

      book.ratings.push({ userId: userId, grade: rating });

      const total = book.ratings.reduce((acc, curr) => acc + curr.grade, 0);
      book.averageRating = Number((total / book.ratings.length).toFixed(1));

      book.save()
        .then(updatedBook => res.status(200).json(updatedBook))
        .catch(error => res.status(400).json({ error }));
    })
    .catch(error => res.status(500).json({ error }));
};