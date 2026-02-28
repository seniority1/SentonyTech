const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    fullname: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    
    // --- RUGGED SECURITY: DEVICE LOCKING ---
    adminIp: { type: String, default: null },
    adminFingerprint: { type: String, default: null },
    
    // For master reset if you get locked out
    masterResetKey: { type: String, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('Admin', AdminSchema);
