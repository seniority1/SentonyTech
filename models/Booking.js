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
    
    // LIVE TRACKING GEOLOCATION FIELDS
    // Coordinates for the service destination (Customer's house)
    userLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },
    // Coordinates for the moving technician
    techLocation: {
        lat: { type: Number, default: 0 },
        lng: { type: Number, default: 0 }
    },
    
    // Command Center Fields
    status: { 
        type: String, 
        enum: [
            'Pending', 
            'Confirmed', 
            'Technician Assigned', 
            'En Route', 
            'Arrived', // Added to match tracker logic
            'Completed', 
            'Cancelled'
        ], 
        default: 'Pending' 
    },
    
    // Technician Details for the Tracking UI
    assignedTech: { 
        type: String, 
        default: 'Unassigned' 
    },
    techPhone: {
        type: String,
        default: ''
    },
    eta: {
        type: String,
        default: 'Calculating...'
    },
    
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', BookingSchema);
