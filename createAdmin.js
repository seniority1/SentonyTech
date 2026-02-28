const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('./models/Admin'); // Ensure this path is correct
require('dotenv').config();

const createAdmin = async () => {
    try {
        // 1. Connect to your Database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB to create Admin...');

        // 2. CONFIGURE YOUR ADMIN DETAILS HERE
        const adminData = {
            fullname: "Sentony Admin",
            email: "your-admin-email@example.com", // Change this
            password: "YourSecurePassword123",      // Change this
        };

        // 3. Check if admin already exists
        const existingAdmin = await Admin.findOne({ email: adminData.email });
        if (existingAdmin) {
            console.log('Admin already exists with this email.');
            process.exit();
        }

        // 4. Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminData.password, salt);

        // 5. Create the Admin entry
        const newAdmin = new Admin({
            fullname: adminData.fullname,
            email: adminData.email,
            password: hashedPassword,
            adminIp: null,           // Leave null so the first login locks it
            adminFingerprint: null   // Leave null so the first login locks it
        });

        await newAdmin.save();
        console.log('✅ Rugged Admin Created Successfully!');
        console.log('Next step: Log in from your chosen device to lock the security.');
        
        process.exit();
    } catch (err) {
        console.error('Error creating admin:', err.message);
        process.exit(1);
    }
};

createAdmin();
