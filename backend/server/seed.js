import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

async function seedAdmin() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medical_app_db';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Check if any Super Admin already exists in the database
    const existingAdmin = await User.findOne({ role: 'super_admin' });

    if (existingAdmin) {
      console.log('Super Admin already exists.');
      process.exit(0);
    }

    // Create the Super Admin. The pre-save hook in User model handles hashing.
    await User.create({
      name: 'Super Admin',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'super_admin',
      phone: '0000000000',
      status: 'active'
    });

    console.log('==================================================');
    console.log('  SUPER ADMIN ACCOUNT SEEDED SUCCESSFULLY!');
    console.log('  Email:    admin@example.com');
    console.log('  Password: Admin@123');
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
