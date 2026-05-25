import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

// Load environment variables
dotenv.config();

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medical_app_db';
    console.log(`Connecting to database: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    // Check if Super Admin already exists
    const adminExists = await User.findOne({ email: 'super@medbook.com' });
    if (adminExists) {
      console.log('Super Admin account already exists in this database.');
    } else {
      await User.create({
        name: 'Super Admin',
        email: 'super@medbook.com',
        password: 'superpassword123',
        role: 'super_admin',
        phone: '0000000000',
        status: 'active'
      });
      console.log('==================================================');
      console.log('  SUPER ADMIN ACCOUNT SEEDED SUCCESSFULLY!');
      console.log('  Email:    super@medbook.com');
      console.log('  Password: superpassword123');
      console.log('==================================================');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

seed();
