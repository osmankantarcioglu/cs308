// api/routes/users.js
var express = require('express');
var router = express.Router();
const Users = require('../db/models/Users');
const { NotFoundError, ValidationError } = require('../lib/Error');

/**
 * @route   GET /users
 * @desc    List users (filters + pagination)
 * @query   role, search, is_active, page=1, limit=10
 */
router.get('/', async function (req, res, next) {
  try {
    const { role, search, is_active, page = 1, limit = 10 } = req.query;

    const query = {};
    if (role) query.role = role;

    if (typeof is_active !== 'undefined') {
      if (is_active === 'true' || is_active === true) query.is_active = true;
      else if (is_active === 'false' || is_active === false) query.is_active = false;
    }

    if (search) {
      const re = { $regex: search, $options: 'i' };
      query.$or = [{ first_name: re }, { last_name: re }, { email: re }];
    }

    const p = Math.max(1, parseInt(page) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (p - 1) * l;

    const users = await Users.find(query)
      .select('-password')
      .skip(skip)
      .limit(l)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Users.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) },
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /users/search/by-email
 * @desc    Find user by exact email
 * @query   email
 */
router.get('/search/by-email', async function (req, res, next) {
  try {
    const { email } = req.query;
    if (!email) throw new ValidationError('email is required');

    const user = await Users.findByEmail(email).select('-password');
    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /users/search/by-taxid
 * @desc    Find user by exact taxID
 * @query   taxID
 */
router.get('/search/by-taxid', async function (req, res, next) {
  try {
    const { taxID } = req.query;
    if (!taxID) throw new ValidationError('taxID is required');

    const user = await Users.findByTaxID(taxID).select('-password');
    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /users/role/:role
 * @desc    List users by role
 */
router.get('/role/:role', async function (req, res, next) {
  try {
    const users = await Users.findByRole(req.params.role)
      .select('-password')
      .lean();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /users/:id
 * @desc    Get single user
 */
router.get('/:id', async function (req, res, next) {
  try {
    const user = await Users.findById(req.params.id).select('-password');
    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, data: user });
  } catch (err) {
    if (err.name === 'CastError') next(new NotFoundError('Invalid user ID'));
    else next(err);
  }
});

/**
 * @route   POST /users
 * @desc    Create user
 * @body    { email, password, first_name, last_name, role?, phone_number?, taxID?, home_address?, is_active?, language? }
 */
router.post('/', async function (req, res, next) {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      role,
      phone_number,
      taxID,
      home_address,
      is_active,
      language,
    } = req.body;

    if (!email || !password || !first_name || !last_name) {
      throw new ValidationError('Missing required fields: email, password, first_name, last_name');
    }

    const payload = { email, password, first_name, last_name };
    if (role !== undefined) payload.role = role;
    if (phone_number !== undefined) payload.phone_number = phone_number;
    if (taxID !== undefined) payload.taxID = taxID;
    if (home_address !== undefined) payload.home_address = home_address;
    if (is_active !== undefined) payload.is_active = is_active;
    if (language !== undefined) payload.language = language;

    const user = new Users(payload);
    // user.created_by = req.user?.id;
    await user.save();

    const safeUser = await Users.findById(user._id).select('-password');
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: safeUser,
    });
  } catch (err) {
    if (err.name === 'ValidationError') next(new ValidationError(err.message));
    else if (err.code === 11000) {
      const dupField = Object.keys(err.keyPattern || {})[0] || 'field';
      next(new ValidationError(`${dupField} already exists`));
    } else next(err);
  }
});

/**
 * @route   PUT /users/:id
 * @desc    Update user
 */
router.put('/:id', async function (req, res, next) {
  try {
    const {
      email,
      password,
      role,
      first_name,
      last_name,
      phone_number,
      taxID,
      home_address,
      is_active,
      language,
    } = req.body;

    const user = await Users.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    if (email !== undefined) user.email = email;
    if (password !== undefined) user.password = password;
    if (role !== undefined) user.role = role;
    if (first_name !== undefined) user.first_name = first_name;
    if (last_name !== undefined) user.last_name = last_name;
    if (phone_number !== undefined) user.phone_number = phone_number;
    if (taxID !== undefined) user.taxID = taxID;
    if (home_address !== undefined) user.home_address = home_address;
    if (is_active !== undefined) user.is_active = is_active;
    if (language !== undefined) user.language = language;

    // user.updated_by = req.user?.id;
    await user.save();

    const safeUser = await Users.findById(user._id).select('-password');
    res.json({ success: true, message: 'User updated successfully', data: safeUser });
  } catch (err) {
    if (err.name === 'CastError') next(new NotFoundError('Invalid user ID'));
    else if (err.name === 'ValidationError') next(new ValidationError(err.message));
    else if (err.code === 11000) {
      const dupField = Object.keys(err.keyPattern || {})[0] || 'field';
      next(new ValidationError(`${dupField} already exists`));
    } else next(err);
  }
});

/**
 * @route   DELETE /users/:id
 * @desc    Soft delete (is_active = false)
 */
router.delete('/:id', async function (req, res, next) {
  try {
    const user = await Users.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    user.is_active = false;
    // user.updated_by = req.user?.id;
    await user.save();

    res.json({ success: true, message: 'User deactivated (soft deleted)' });
  } catch (err) {
    if (err.name === 'CastError') next(new NotFoundError('Invalid user ID'));
    else next(err);
  }
});

/**
 * @route   DELETE /users/:id/hard
 * @desc    Permanently delete user
 */
router.delete('/:id/hard', async function (req, res, next) {
  try {
    const user = await Users.findByIdAndDelete(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    res.json({ success: true, message: 'User permanently deleted' });
  } catch (err) {
    if (err.name === 'CastError') next(new NotFoundError('Invalid user ID'));
    else next(err);
  }
});

/**
 * @route   POST /users/:id/activate
 * @desc    Reactivate a soft-deleted user
 */
router.post('/:id/activate', async function (req, res, next) {
  try {
    const user = await Users.findById(req.params.id);
    if (!user) throw new NotFoundError('User not found');

    user.is_active = true;
    await user.save();

    const safeUser = await Users.findById(user._id).select('-password');
    res.json({ success: true, message: 'User activated', data: safeUser });
  } catch (err) {
    if (err.name === 'CastError') next(new NotFoundError('Invalid user ID'));
    else next(err);
  }
});

module.exports = router;
