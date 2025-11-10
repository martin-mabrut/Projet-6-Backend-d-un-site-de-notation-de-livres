require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('Connexion à MongoDB réussie !'))
.catch((err) => console.log('Connexion à MongoDB échouée !'));

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.get('/api/books', (req, res) => {
  const books = [
    {
      userId: 'Martin',
      title: 'Harry Potter',
      author: 'J.K. Rowling',
      imageUrl: "URL de l'image",
      year: 1997,
      genre: 'SF',
      ratings: [
        { userId: 'Martin', grade: 5 }
      ],
      averageRating: 5
    }
  ];

  res.status(200).json(books);
});

module.exports = app;