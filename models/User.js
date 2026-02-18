const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    verificationCode: { type: String }, // Store the 4-digit code
    isVerified: { type: Boolean, default: false }, // Track if they are verified
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
