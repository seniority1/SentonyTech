const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// --- PROXY CONFIGURATION ---
// Required for express-rate-limit to work correctly on Render/Heroku
app.set('trust proxy', 1);

// --- MIDDLEWARE ---
app.use(express.json());
app.use(cors());

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SentonyTech Database Connected...'))
    .catch(err => console.error('❌ Connection Error:', err));

// --- DEFINE ROUTES ---
// All auth routes (login, register, reset) are prefixed with /api/auth
app.use('/api/auth', require('./routes/auth')); 

// Basic Health Check Route
app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
