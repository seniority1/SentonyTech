const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Phone is optional because Google Sign-In does not provide it by default
    phone: { type: String, required: false }, 
    // Password is optional to allow Google Users to exist without one
    password: { type: String, required: false }, 
    
    // --- GOOGLE AUTH FIELD ---
    googleId: { type: String, unique: true, sparse: true },
    
    // --- VERIFICATION FIELDS ---
    verificationCode: { type: String },
    codeCreatedAt: { type: Date }, 
    isVerified: { type: Boolean, default: false },
    
    // --- PASSWORD RESET FIELDS ---
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
