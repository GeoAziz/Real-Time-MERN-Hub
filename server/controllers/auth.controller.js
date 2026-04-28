import bcrypt from 'bcryptjs';
import User from '../models/user.model.js';
import generateTokenAndSetCookie from '../utils/generateToken.js';
import validator from 'validator';

const sanitizeAuthInput = (value) => validator.trim(String(value || ''));

export const login = async (req, res) => {
  try {
    const username = sanitizeAuthInput(req.body.username);
    const password = String(req.body.password || '');

    if (!validator.isLength(username, { min: 3, max: 20 })) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' });
    }

    const user = await User.findOne({ username });
    const isPasswordCorrect = await bcrypt.compare(
      password,
      user?.password || ''
    );
    if (!user || !isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }
    generateTokenAndSetCookie(user._id, res);
    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log('error in login controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const signup = async (req, res) => {
  try {
    const fullName = sanitizeAuthInput(req.body.fullName);
    const username = sanitizeAuthInput(req.body.username);
    const password = String(req.body.password || '');
    const confirmPassword = String(req.body.confirmPassword || '');
    const gender = sanitizeAuthInput(req.body.gender).toLowerCase();

    if (!validator.isLength(fullName, { min: 2, max: 50 })) {
      return res.status(400).json({ error: 'Full name must be between 2 and 50 characters' });
    }

    if (!validator.isLength(username, { min: 3, max: 20 }) || !validator.isAlphanumeric(username)) {
      return res.status(400).json({ error: 'Username must be 3-20 alphanumeric characters' });
    }

    if (!validator.isStrongPassword(password, { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 0 })) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include upper, lower, and numeric characters' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "passwords don't match" });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ error: 'Gender must be male or female' });
    }

    const user = await User.findOne({ username });
    if (user) {
      return res
        .status(400)
        .json({ error: 'Username already exists! choose another' });
    }
    //Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    //https://avatar-placeholder.iran.liara.run/

    const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
    const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
    const newUser = new User({
      fullName,
      username,
      password: hashedPassword,
      gender,
      profilePic: gender === 'male' ? boyProfilePic : girlProfilePic,
    });
    if (newUser) {
      generateTokenAndSetCookie(newUser._id, res);
      await newUser.save();

      res.status(200).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.log('error in signup controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
export const logout = (req, res) => {
  try {
    res.cookie('jwt', '', { maxAge: 0 });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.log('error in logout controller', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
