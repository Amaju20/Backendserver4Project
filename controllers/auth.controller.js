import User from '../models/User.model.js';
import { signToken, sendTokenCookie } from '../utils/generateToken.js';

export const signup = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
    });
    if (existingUser) {
      const field = existingUser.email === normalizedEmail ? 'Email' : 'Username';
      return res.status(409).json({ message: `${field} is already in use` });
    }

    const user = await User.create({ name, username, email, password });

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.status(201).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    const normalized = identifier.toLowerCase();

    const user = await User.findOne({
      $or: [{ email: normalized }, { username: normalized }],
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user._id);
    sendTokenCookie(res, token);

    res.status(200).json({ user, token });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    req.user.name = name;
    await req.user.save();
    res.status(200).json({ user: req.user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};
