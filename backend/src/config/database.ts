import mongoose from 'mongoose';
import User from '../models/User';

const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    const legacyAvatarCleanup = await User.collection.updateMany(
      { avatarUrl: { $exists: true } },
      { $unset: { avatarUrl: '' } }
    );
    if (legacyAvatarCleanup.modifiedCount > 0) {
      console.log(`Removed legacy avatar data from ${legacyAvatarCleanup.modifiedCount} user record(s).`);
    }
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

export default connectDB;