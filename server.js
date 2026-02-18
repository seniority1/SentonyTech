const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// IMPORT THE MODEL HERE
const User = require('./models/User');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ SentonyTech Database Connected...'))
    .catch(err => console.error('❌ Connection Error:', err));

app.get('/', (req, res) => res.send('SentonyTech API is Running...'));

// Registration Route
app.post('/api/register', async (req, res) => {
    try {
        const { fullname, email, phone, password } = req.body;

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({
            fullname,
            email,
            phone,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: "User registered successfully!" });

    } catch (err) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server started on port ${PORT}`));
