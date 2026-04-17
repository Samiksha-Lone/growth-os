import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
  createdAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  githubUrl: String,
  linkedinUrl: String,
  portfolioUrl: String,
  avatarUrl: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', function (this: IUser, next: any) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash password with cost of 12
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(this.password as string, salt as string, (err, hash) => {
      if (err) return next(err);

      // Override the cleartext password with the hashed one
      this.password = hash as string;
      next();
    });
  });
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>('User', userSchema);