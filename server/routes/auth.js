const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jsonWebToken = require('jsonwebtoken');
const router = express.Router();
const protect = require('../middleware/auth');

router.post('/register', async (req, res) => {
    // Handle registration logic here
    try {
        const UserExists = await User.findOne({ email: req.body.email });

        if (UserExists == null) {
            // Create new user
            await User.create({
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 10),
                name: req.body.name
            });
            res.status(201).json({ message: 'User registered successfully' });
        } else {
            res.status(400).json({ message: 'User already exists' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error occurred while registering user' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (user && await bcrypt.compare(req.body.password, user.password)) {
            const jwtToken = jsonWebToken.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3h' });

            res.status(200).json({ message: 'Login successful', token: jwtToken });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error occurred while logging in' });
    }
});

router.get('/protected', protect, (req, res) => {
    res.json({ message: 'You are authorized', user: req.user });
});

module.exports = router;