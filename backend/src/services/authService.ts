import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';

export class HttpError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
  }
}

export class AuthService {
  static async register(name: string, email: string, password: string): Promise<{ user: IUser; token: string }> {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new HttpError('User already exists', 409);
    }

    const user = new User({ name, email, password });
    await user.save();

    const token = this.generateToken(user._id.toString());
    return { user, token };
  }

  static async login(email: string, password: string): Promise<{ user: IUser; token: string }> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new HttpError('Invalid credentials', 401);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new HttpError('Invalid credentials', 401);
    }

    const token = this.generateToken(user._id.toString());
    return { user, token };
  }

  private static generateToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
  }
}