const express = require("express")
const router = express.Router()
const auth = require("../middleware/auth")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const config = require("config")
const { check, validationResult } = require("express-validator")
const db = require("../config/database")
const User = require("../models/User")

// @route   POST user/create
// @desc    create a new user
// @access  public
router.post(
	"/create",
	[
		check("firstName", "PLease enter firstName").not().isEmpty(),
		check("lastName", "PLease enter lastName").not().isEmpty(),
		check("userName", "PLease enter userName").not().isEmpty(),
		check("email", "Please Include a Valid Email").isEmail(),
		check("password", "Please Enter a password with 8 or more Character").isLength({
			min: 8
		})
	],

	async (req, res) => {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const userData = req.body

		try {
			//checking whether email has already been registered

			const isEmailRegistered = await User.findOne({
				where: {
					email: userData.email
				}
			})

			if (isEmailRegistered) {
				return res.status(400).json({ msg: "User already exists" })
			}

			//salting and hashing
			const salt = await bcrypt.genSalt(10)
			userData.password = await bcrypt.hash(userData.password, salt)

			//saving in database
			const savedUser = await User.create(userData)

			//gen payload
			const payload = {
				user: {
					id: savedUser.id
				}
			}

			jwt.sign(
				payload,
				config.get("jwtSecret"),
				{
					expiresIn: 3600000
				},
				(err, token) => {
					if (err) throw err
					res.json({ token })
				}
			)
		} catch (error) {
			console.error(error.message)
			res.status(500).send("Server Error")
		}
	}
)

// @route   POST user/login
// @desc    login user
// @access  public
router.post(
	"/login",
	[
		check("email", "Please Include a Valid Email").isEmail(),
		check("password", "Please Enter a password").exists()
	],

	async (req, res) => {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const userData = req.body
		try {
			//get user record
			const savedUser = await User.findOne({
				where: {
					email: userData.email
				}
			})

			console.log(savedUser)
			const savedUser = await User.findOne({
				where: {
					email: userData.email
				}
			})

			if (!savedUser) {
				return res.status(400).json({ msg: "Invalid Credentials" })
			}

			const isMatch = await bcrypt.compare(userData.password, savedUser.password)

			if (!isMatch) {
				return res.status(400).json({ msg: "Invalid Credentials" })
			}

			//gen payload
			const payload = {
				user: {
					id: savedUser.id
				}
			}

			jwt.sign(
				payload,
				config.get("jwtSecret"),
				{
					expiresIn: 3600000
				},
				(err, token) => {
					if (err) throw err
					res.json({ token })
				}
			)
		} catch (error) {
			console.error(error.message)
			res.status(500).send("Server Error")
		}
	}
)

// @route   GET user/checkUserName
// @desc    checks for availability of usernames
// @access  public

router.post(
	"/check-username",
	[check("userName", "Parameter required").exists()],
	async (req, res) => {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const data = req.body
		try {
			const result = await User.findAll({
				where: {
					userName: data.userName
				}
			})
			if (result.length > 0) {
				res.status(200).json(true)
			} else {
				res.status(200).json(false)
			}
		} catch (error) {
			console.log(error)
		}
	}
)

module.exports = router
