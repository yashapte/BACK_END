// middlewares/auth.js
const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.Token; 
  console.log("this is token",token)
  
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, 'webtoken');
    console.log('decoded', decoded)
    req.user = decoded; 
    next();
  } catch (err) {
    return res.status(403).json({ msg: 'Token is not valid' });
  }
}


module.exports = authenticateToken;