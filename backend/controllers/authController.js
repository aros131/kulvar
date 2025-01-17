const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Kullanıcı Kaydı
exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Şifreyi hashleme
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcı oluşturma
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
    });

    await user.save();
    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    res.status(500).json({ message: 'Kayıt sırasında hata oluştu.', error: err.message });
  }
};

// Kullanıcı Girişi
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Kullanıcıyı e-posta ile bul
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    // Şifre doğrulama
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: 'Şifre yanlış!' });

    // Token oluşturma
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role });
  } catch (err) {
    res.status(500).json({ message: 'Giriş sırasında hata oluştu.', error: err.message });
  }
};

// Kullanıcı Bilgilerini Al
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Kullanıcı bilgileri alınamadı.', error: err.message });
  }
};
