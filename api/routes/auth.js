const express = require('express');
const router = express.Router();
const Users = require('../db/models/Users');
const { ValidationError, UnauthorizedError } = require('../lib/Error');
const { generateToken, authenticate } = require('../lib/auth');
const bcrypt = require('bcryptjs');

/**
 * @route   POST /auth/login
 * @desc    Login user and return JWT token
 * @body    { email, password }
 */
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            throw new ValidationError('Email and password are required');
        }

        // Check if JWT_SECRET is configured
        const config = require('../config');
        if (!config.JWT.SECRET) {
            console.error('JWT_SECRET is not configured in environment variables');
            throw new Error('Server configuration error: JWT_SECRET is not set. Please set JWT_SECRET in your .env file.');
        }

        // Find user by email
        const user = await Users.findByEmail(email);

        if (!user) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new UnauthorizedError('Account is deactivated. Please contact administrator.');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedError('Invalid email or password');
        }

        // Generate JWT token
        const token = generateToken(user._id.toString());

        // Return user data (without password) and token
        const userData = await Users.findById(user._id).select('-password');

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   GET /auth/me
 * @desc    Return current authenticated user (requires Bearer token)
 */
router.get('/me', authenticate, async (req, res, next) => {
    try {
        return res.json({ success: true, data: req.user });
    } catch (error) {
        next(error);
    }
});

/**
 * @route   POST /auth/register
 * @desc    Register a new customer (public endpoint)
 * @body    { email, password, first_name, last_name, phone_number?, home_address }
 */
router.post('/register', async (req, res, next) => {
    try {
        const {
            email,
            password,
            first_name,
            last_name,
            phone_number,
            home_address
        } = req.body;

        if (!email || !password || !first_name || !last_name || !home_address) {
            throw new ValidationError('Missing required fields: email, password, first_name, last_name, home_address');
        }

        // Check if email already exists
        const existingUser = await Users.findByEmail(email);
        if (existingUser) {
            throw new ValidationError('Email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create customer user
        const user = new Users({
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            first_name,
            last_name,
            phone_number,
            home_address,
            role: 'customer' // Default role for registration
        });

        await user.save();

        // Generate token
        const token = generateToken(user._id.toString());

        const userData = await Users.findById(user._id).select('-password');

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            data: {
                user: userData,
                token
            }
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            next(new ValidationError(error.message));
        } else if (error.code === 11000) {
            const dupField = Object.keys(error.keyPattern || {})[0] || 'field';
            next(new ValidationError(`${dupField} already exists`));
        } else {
            next(error);
        }
    }
});

module.exports = router;

