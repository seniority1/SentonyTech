const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    unitId: { type: mongoose.Schema.Types.ObjectId, ref: 'ACUnit', required: true },
    serviceType: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    whatsapp: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true },
    landmark: { type: String },
    status: { 
        type: String, 
        enum: ['Pending', 'Confirmed', 'Technician Assigned', 'En Route', 'Completed', 'Cancelled'], 
        default: 'Pending' 
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
