const express = require("express")
const router = express.Router()
const Users = require("../db/models/Users")
const { NotFoundError, ValidationError } = require("../lib/Error")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

router.get("/", async function (req, res, next) {
  try {
    const { role, search, is_active, page = 1, limit = 10 } = req.query

    const query = {}
    if (role) query.role = role

    if (typeof is_active !== "undefined") {
      if (is_active === "true" || is_active === true) query.is_active = true
      else if (is_active === "false" || is_active === false) query.is_active = false
    }

    if (search) {
      const re = { $regex: search, $options: "i" }
      query.$or = [{ first_name: re }, { last_name: re }, { email: re }]
    }

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.min(100, Math.max(1, parseInt(limit) || 10))
    const skip = (p - 1) * l

    const users = await Users.find(query)
      .select("-password")
      .skip(skip)
      .limit(l)
      .sort({ createdAt: -1 })
      .lean()

    const total = await Users.countDocuments(query)

    res.json({
      success: true,
      data: {
        users,
        pagination: { page: p, limit: l, total, pages: Math.ceil(total / l) }
      }
    })
  } catch (err) {
    next(err)
  }
})

router.get("/search/by-email", async function (req, res, next) {
  try {
    const { email } = req.query
    if (!email) throw new ValidationError("email is required")

    const user = await Users.findByEmail(email).select("-password")
    if (!user) throw new NotFoundError("User not found")

    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

router.get("/search/by-taxid", async function (req, res, next) {
  try {
    const { taxID } = req.query
    if (!taxID) throw new ValidationError("taxID is required")

    const user = await Users.findByTaxID(taxID).select("-password")
    if (!user) throw new NotFoundError("User not found")

    res.json({ success: true, data: user })
  } catch (err) {
    next(err)
  }
})

router.get("/role/:role", async function (req, res, next) {
  try {
    const users = await Users.findByRole(req.params.role).select("-password").lean()
    res.json({ success: true, data: users })
  } catch (err) {
    next(err)
  }
})

router.get("/:id", async function (req, res, next) {
  try {
    const user = await Users.findById(req.params.id).select("-password")
    if (!user) throw new NotFoundError("User not found")

    res.json({ success: true, data: user })
  } catch (err) {
    if (err.name === "CastError") next(new NotFoundError("Invalid user ID"))
    else next(err)
  }
})

router.post("/", async function (req, res, next) {
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
      language
    } = req.body

    if (!email || !password || !first_name || !last_name) {
      throw new ValidationError("Missing required fields: email, password, first_name, last_name")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const payload = { email, password: hashedPassword, first_name, last_name }
    if (role !== undefined) payload.role = role
    if (phone_number !== undefined) payload.phone_number = phone_number
    if (taxID !== undefined) payload.taxID = taxID
    if (home_address !== undefined) payload.home_address = home_address
    if (is_active !== undefined) payload.is_active = is_active
    if (language !== undefined) payload.language = language

    const user = new Users(payload)
    await user.save()

    const safeUser = await Users.findById(user._id).select("-password")
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: safeUser
    })
  } catch (err) {
    if (err.name === "ValidationError") next(new ValidationError(err.message))
    else if (err.code === 11000) {
      const dupField = Object.keys(err.keyPattern || {})[0] || "field"
      next(new ValidationError(`${dupField} already exists`))
    } else next(err)
  }
})

router.put("/:id", async function (req, res, next) {
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
      language
    } = req.body

    const user = await Users.findById(req.params.id)
    if (!user) throw new NotFoundError("User not found")

    if (email !== undefined) user.email = email
    if (password !== undefined) {
      const hashedPassword = await bcrypt.hash(password, 10)
      user.password = hashedPassword
    }
    if (role !== undefined) user.role = role
    if (first_name !== undefined) user.first_name = first_name
    if (last_name !== undefined) user.last_name = last_name
    if (phone_number !== undefined) user.phone_number = phone_number
    if (taxID !== undefined) user.taxID = taxID
    if (home_address !== undefined) user.home_address = home_address
    if (is_active !== undefined) user.is_active = is_active
    if (language !== undefined) user.language = language

    await user.save()

    const safeUser = await Users.findById(user._id).select("-password")
    res.json({ success: true, message: "User updated successfully", data: safeUser })
  } catch (err) {
    if (err.name === "CastError") next(new NotFoundError("Invalid user ID"))
    else if (err.name === "ValidationError") next(new ValidationError(err.message))
    else if (err.code === 11000) {
      const dupField = Object.keys(err.keyPattern || {})[0] || "field"
      next(new ValidationError(`${dupField} already exists`))
    } else next(err)
  }
})

router.delete("/:id", async function (req, res, next) {
  try {
    const user = await Users.findById(req.params.id)
    if (!user) throw new NotFoundError("User not found")

    user.is_active = false
    await user.save()

    res.json({ success: true, message: "User deactivated (soft deleted)" })
  } catch (err) {
    if (err.name === "CastError") next(new NotFoundError("Invalid user ID"))
    else next(err)
  }
})

router.delete("/:id/hard", async function (req, res, next) {
  try {
    const user = await Users.findByIdAndDelete(req.params.id)
    if (!user) throw new NotFoundError("User not found")

    res.json({ success: true, message: "User permanently deleted" })
  } catch (err) {
    if (err.name === "CastError") next(new NotFoundError("Invalid user ID"))
    else next(err)
  }
})

router.post("/:id/activate", async function (req, res, next) {
  try {
    const user = await Users.findById(req.params.id)
    if (!user) throw new NotFoundError("User not found")

    user.is_active = true
    await user.save()

    const safeUser = await Users.findById(user._id).select("-password")
    res.json({ success: true, message: "User activated", data: safeUser })
  } catch (err) {
    if (err.name === "CastError") next(new NotFoundError("Invalid user ID"))
    else next(err)
  }
})

router.post("/login", async function (req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      throw new ValidationError("email and password are required")
    }

    const user = await Users.findByEmail(email)
    if (!user || !user.is_active) {
      throw new ValidationError("Invalid credentials")
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      throw new ValidationError("Invalid credentials")
    }

    const payload = { id: user._id, role: user.role }
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" })

    const safeUser = {
      id: user._id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name
    }

    res.json({
      success: true,
      data: {
        token,
        user: safeUser
      }
    })
  } catch (err) {
    next(err)
  }
})

module.exports = router

