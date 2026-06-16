const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();


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



module.exports = router;