import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../services/emailService.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role, fitnessGoals, specialization, profilePicture } = req.body;

    // Validate role
    if (!["user", "coach"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Role must be 'user' or 'coach'." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Prepare user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      role,
       profilePicture,
    };

    // Add role-specific fields
    if (role === "user") {
      userData.fitnessGoals = fitnessGoals;
    } else if (role === "coach") {
      userData.specialization = specialization;
    }

    // Create user
    const user = await User.create(userData);

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Fire-and-forget welcome email
    sendWelcomeEmail({ name: user.name, email: user.email, role: user.role }).catch(() => {});

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Error registering user", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error logging in", error: err.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture || null,
      specialization: user.specialization || null,
      fitnessGoals: user.fitnessGoals || null,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching profile", error: error.message });
  }
};

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin')
      return res.status(403).json({ message: 'Admin yetkisi yok.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Hatalı şifre.' });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.status(200).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Giriş hatası.', error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Mevcut ve yeni şifre zorunludur.' });

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: 'Mevcut şifre yanlış.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.status(200).json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (err) {
    res.status(500).json({ message: 'Şifre güncellenemedi.', error: err.message });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    // Admins may delete another user via X-Target-User; anyone else can only
    // delete their own account (the header is ignored for non-admins so a
    // regular user can't pass someone else's id to delete them).
    const targetUserId = req.user.role === "admin" ? req.headers["x-target-user"] : null;
    const idToDelete = targetUserId || req.user._id;

    await User.findByIdAndDelete(idToDelete);
    res.status(200).json({ message: 'Hesap silindi.' });
  } catch (err) {
    res.status(500).json({ message: 'Hesap silinemedi.', error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'E-posta zorunludur.' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Always return 200 to avoid leaking whether the email exists
    if (!user) return res.status(200).json({ message: 'Şifre sıfırlama e-postası gönderildi.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    await sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });

    res.status(200).json({ message: 'Şifre sıfırlama e-postası gönderildi.' });
  } catch (err) {
    res.status(500).json({ message: 'Şifre sıfırlama başlatılamadı.', error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token ve yeni şifre zorunludur.' });
    if (newPassword.length < 6) return res.status(400).json({ message: 'Şifre en az 6 karakter olmalı.' });

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });
    if (!user) return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token.' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.status(200).json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (err) {
    res.status(500).json({ message: 'Şifre sıfırlanamadı.', error: err.message });
  }
};

export const getUserProfileById = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      fitnessGoals: user.fitnessGoals || "Not specified",
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user profile", error: error.message });
  }
};
