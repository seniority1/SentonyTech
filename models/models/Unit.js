const mongoose = require('mongoose');

const ACUnitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nickname: { type: String, required: true },
    brand: { type: String, required: true },
    hp: { type: String, required: true },
    type: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ACUnit', ACUnitSchema);
