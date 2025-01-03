const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract token from header
    if (!token) {
        return res.status(401).json({ message: 'Access denied, token missing' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify token
        req.user = verified; // Add user info to request
        next(); // Proceed
    } catch (error) {
        res.status(403).json({ message: 'Invalid token' });
    }
};

module.exports = authenticateToken;
