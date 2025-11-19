const jwt = require('jsonwebtoken');
const config = require('../config');
const Users = require('../db/models/Users');
const { UnauthorizedError } = require('./Error');

/**
 * Generate JWT token for a user
 * @param {string} userId - User ID to encode in the token
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    const payload = {
        userId: userId,
        iat: Math.floor(Date.now() / 1000) // Issued at time
    };

    const options = {
        expiresIn: config.TOKEN_EXPIRE_TIME * 60 // Convert minutes to seconds
    };

    return jwt.sign(payload, config.JWT.SECRET, options);
};

/**
 * Middleware to authenticate requests using JWT token
 * Extracts token from Authorization header and verifies it
 * Attaches user object to req.user (without password)
 */
const authenticate = async (req, res, next) => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedError('No token provided. Please provide a valid Bearer token.');
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        if (!token) {
            throw new UnauthorizedError('Token is missing');
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, config.JWT.SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new UnauthorizedError('Token has expired. Please login again.');
            } else if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedError('Invalid token. Please provide a valid token.');
            } else {
                throw new UnauthorizedError('Token verification failed');
            }
        }

        // Find user by ID from token
        const user = await Users.findById(decoded.userId).select('-password');
        
        if (!user) {
            throw new UnauthorizedError('User not found. Token may be invalid.');
        }

        // Check if user is active
        if (!user.is_active) {
            throw new UnauthorizedError('Account is deactivated. Please contact administrator.');
        }

        // Attach user to request object
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication - attaches req.user if token exists and is valid
 * Does not throw error if token is missing or invalid
 */
const optionalAuthenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
        return next();
    }

    try {
        const decoded = jwt.verify(token, config.JWT.SECRET);
        const user = await Users.findById(decoded.userId).select('-password');

        if (user && user.is_active) {
            req.user = user;
        }
    } catch (error) {
        console.warn('Optional authentication failed:', error.message);
    } finally {
        next();
    }
};

module.exports = {
    generateToken,
    authenticate,
    optionalAuthenticate
};

