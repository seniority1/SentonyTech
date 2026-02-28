const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- PROXY CONFIGURATION ---
app.set('trust proxy', 1);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SentonyTech Database Connected...'))
    .catch(err => console.error('❌ Connection Error:', err));

// --- DEFINE ROUTES ---

// 1. Auth Routes (Login/Register)
app.use('/api/auth', require('./routes/auth')); 

// 2. AC Unit Routes (User's Saved Units)
app.use('/api/units', require('./routes/units')); 

// 3. Booking Routes (New Bookings & Telegram Alerts)
app.use('/api/bookings', require('./routes/bookings')); 

// 4. History Route (VALIDATING THE FRONTEND FETCH)
// This links your frontend's fetch('/api/history') to your history logic
app.use('/api/history', require('./routes/history')); 

// Basic Health Check Route
app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
