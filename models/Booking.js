const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    unitId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'ACUnit', 
        required: true 
    },
    // For quick display without extra database lookups
    customerName: { type: String }, 
    unitNickname: { type: String }, 
    
    // Technical Specs
    hp: { type: String, required: true }, 
    quantity: { type: Number, default: 1 }, 
    
    // Service Details
    serviceType: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    
    // Contact & Location
    whatsapp: { type: String, required: true },
    phone: { type: String },
    address: { type: String, required: true },
    landmark: { type: String },
    
    // Command Center Fields
    status: { 
        type: String, 
        enum: [
            'Pending', 
            'Confirmed', 
            'Technician Assigned', 
            'En Route', 
            'Completed', 
            'Cancelled'
        ], 
        default: 'Pending' 
    },
    // NEW: Field to store the assigned technician's name/ID
    assignedTech: { 
        type: String, 
        default: 'Unassigned' 
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
