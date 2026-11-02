import mongoose from 'mongoose';
import dns from 'dns';
import { seedXIICohort } from '../services/seedService.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // ignore
}

const run = async () => {
  const mongoUri = process.env.MONGO_URI || process.argv[2];
  if (!mongoUri) {
    console.error('❌ Please provide MONGO_URI as an environment variable or command-line argument:');
    console.error('   node server/scripts/seedXIICohort.js "mongodb+srv://..."');
    process.exit(1);
  }

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB.');

    const result = await seedXIICohort();
    console.log('✨ Results:', JSON.stringify(result, null, 2));

    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding XII cohort:', error);
    process.exit(1);
  }
};

run();
