const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
    let token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if it's an Admin first
        let account = await Admin.findById(decoded.id);
        
        // If not admin, check if it's a User
        if (!account) {
            account = await User.findById(decoded.id);
        }

        if (!account) return res.status(401).json({ message: 'Account not found' });

        req.user = account;
        req.user.role = decoded.role; // Attach role from token
        next();
    } catch (error) {
        res.status(401).json({ message: 'Session expired. Please login again.' });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Rugged Security: Admin access required.' });
    }
};

module.exports = { protect, adminOnly };
