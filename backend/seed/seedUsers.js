require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const connectDB = require('../config/db');

const seedUsers = [
  // Admin
  {
    name: 'Admin Warden',
    email: 'admin@hcms.com',
    password: 'admin123',
    role: 'admin',
  },
  // Maintenance Staff
  {
    name: 'Electricity Staff',
    email: 'staff1@hcms.com',
    password: 'staff123',
    role: 'staff',
    department: 'Electricity',
    phone: '9000000001',
  },
  {
    name: 'Water Staff',
    email: 'staff2@hcms.com',
    password: 'staff123',
    role: 'staff',
    department: 'Water',
    phone: '9000000002',
  },
  {
    name: 'Cleanliness Staff',
    email: 'staff3@hcms.com',
    password: 'staff123',
    role: 'staff',
    department: 'Cleanliness',
    phone: '9000000003',
  },
  {
    name: 'Internet Staff',
    email: 'staff4@hcms.com',
    password: 'staff123',
    role: 'staff',
    department: 'Internet',
    phone: '9000000004',
  },
];

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting seed...');

  for (const userData of seedUsers) {
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`⚠️  User already exists: ${userData.email} — skipping`);
    } else {
      const user = await User.create(userData);
      console.log(`✅ Created ${user.role}: ${user.name} (${user.email})`);
    }
  }

  console.log('✅ Seed complete!');
  console.log('\n--- Login Credentials ---');
  console.log('Admin:  admin@hcms.com  / admin123');
  console.log('Staff1: staff1@hcms.com / staff123  (Electricity)');
  console.log('Staff2: staff2@hcms.com / staff123  (Water)');
  console.log('Staff3: staff3@hcms.com / staff123  (Cleanliness)');
  console.log('Staff4: staff4@hcms.com / staff123  (Internet)');
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
