const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json()); // Allows the server to read JSON data
app.use(cors()); // Allows your frontend to talk to your backend

// Connect to MongoDB using the variable you set in Render
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SentonyTech Database Connected...'))
    .catch(err => console.error('❌ Connection Error:', err));

// Test Route
app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// Import and use routes
// We will add the registration logic here in the next step!

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
