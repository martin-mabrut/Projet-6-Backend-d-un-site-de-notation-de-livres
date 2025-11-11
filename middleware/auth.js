require('dotenv').config();
const jwt = require('jsonwebtoken');
 
module.exports = (req, res, next) => {
   try {
       const secret = process.env.JWT_SECRET;
       if (!secret) throw new Error('JWT_SECRET manquant');
       const token = req.headers.authorization.split(' ')[1];
       const decodedToken = jwt.verify(token, secret);
       const userId = decodedToken.userId;
       req.auth = {
           userId: userId
       };
    next();
   } catch(error) {
       res.status(401).json({ message: 'Requête non authentifiée !' });
   }
};