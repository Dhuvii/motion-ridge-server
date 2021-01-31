const express = require("express")
const { Sequelize } = require("sequelize")
const transporter = require("../middleware/email")
const router = express.Router()
const auth = require("../middleware/auth")
const { defaultAuth } = require("../config/firebaseAdmin")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const config = require("config")
const { check, validationResult } = require("express-validator")
const User = require("../models/User")

// @route   POST user/getUserInfo
// @desc    get user info based on token
// @access  private

router.get("/getuser", auth, async (req, res) => {
	try {
		const user = await User.findOne({ where: { id: req.user.id } })
		res.status(200).json(user)
	} catch (error) {
		console.log(error)
	}
})

// @route   POST user/create
// @desc    create a new user
// @access  public
router.post(
	"/create",
	[
		check("firstName", "PLease enter firstName").not().isEmpty().escape().trim(),
		check("lastName", "PLease enter lastName").not().isEmpty().escape().trim(),
		check("userName", "PLease enter userName").not().isEmpty().escape().trim(),
		check("email", "Please Include a Valid Email").isEmail().trim().normalizeEmail(),
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
				return res
					.status(400)
					.json({ code: "auth/email-already-in-use", msg: "User already exists" })
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
				config.get("JWTSECRET"),
				{
					expiresIn: 3600000
				},
				(err, token) => {
					if (err) throw err

					res.json({ ...savedUser.dataValues, token })
				}
			)

			//send verification email
			jwt.sign(
				{
					user: {
						id: savedUser.id
					}
				},
				config.get("JWTSECRET"),
				{
					expiresIn: 600
				},
				async (err, token) => {
					if (err) throw err
					try {
						await transporter.sendMail({
							from: '"Motion-ridge" <motion-ridge@graphicridge.com>', // sender address
							to: userData.email, // list of receivers
							subject: "Verfication email", // Subject line
							text: "Motion Ridge", // plain text body
							html: `
							<html>
								<head>
								<style type="text/css">
								.btn
								{
									padding:10px 15px;
									border-radius:6px;
									color: #F9FAFB;
									background-color:#27272A;
									cursor:pointer;
									text-decoration: none;
								}
								</style>
								</head>
								<body style="height:300px">
								<body>
								<h2>Hello ${userData.firstName} ${userData.lastName}, welcome to motion ridge</h2>
								<h3>Click the button to verify your email</h3>
								<a class="btn" href="${process.env.REDIRECT_URI}/verify-my-email/${token}" ><span style="color:white">Click here to verify</span></a>
								</body>
							</html>
				`
						})
					} catch (error) {
						console.log(error)
					}
				}
			)
		} catch (error) {
			console.error(error.message)
			res.status(500).send("Server Error")
		}
	}
)

// @route   POST user/verify-my-email
// @desc    verifies users email
// @access  private
router.post("/verify-my-email", auth, async (req, res) => {
	const user = req.user
	try {
		await User.update(
			{ isEmailVerified: true },
			{
				where: {
					id: user.id
				}
			}
		)

		res.status(200).json(true)
	} catch (error) {
		res.status(500).send("Server Error")
		console.log(error)
	}
})

// @route   POST user/resend-email
// @desc    resend verification email
// @access  private
router.post("/resendemail", auth, async (req, res) => {
	const userData = await User.findOne({ where: { id: req.user.id } })
	const token = req.body
	try {
		if (!userData.isEmailVerified) {
			await transporter.sendMail({
				from: '"Motion-ridge" <motion-ridge@graphicridge.com>', // sender address
				to: userData.email, // list of receivers
				subject: "Verfication email", // Subject line
				text: "Motion Ridge", // plain text body
				html: `
								<html>
									<head>
									<style type="text/css">
									.btn
									{
										padding:10px 15px;
										border-radius:6px;
										color: #F9FAFB;
										background-color:#27272A;
										cursor:pointer;
										text-decoration: none;
									}
									</style>
									</head>
									<body style="height:300px">
									<body>
									<h2>Hello ${userData.firstName} ${userData.lastName}, welcome to motion ridge</h2>
									<h3>Click the button to verify your email</h3>
									<a class="btn" href="${process.env.REDIRECT_URI}/verify-my-email/${token}" ><span style="color:white">Click here to verify</span></a>
									</body>
								</html>
					`
			})
			res.status(200).json("sent")
		}
	} catch (error) {
		res.status(500).send("Server Error")
		console.log(error)
	}
})

// @route   POST user/reset-password
// @desc    resets password
// @access  private
router.post("/reset-password", async (req, res) => {
	const { password, token } = req.body

	try {
		const { user } = jwt.verify(token, config.get("JWTSECRET"))

		//salting and hashing
		const salt = await bcrypt.genSalt(10)
		newPassword = await bcrypt.hash(password, salt)

		await User.update(
			{ password: newPassword },
			{
				where: {
					id: user.id
				}
			}
		)

		res.status(200).json(true)
	} catch (error) {
		res.status(500).send("Server Error")
		console.log(error)
	}
})

// @route   POST user/send-reset-password
// @desc    sends resend password link to mail
// @access  public
router.post("/send-reset-password", async (req, res) => {
	try {
		const userData = await User.findOne({ where: { email: req.body.email } })

		if (!userData) {
			res.status(400).json({ code: "auth/user-not-found", msg: "No record found" })
		}

		//send reset password link to email
		jwt.sign(
			{
				user: {
					id: userData.id
				}
			},
			config.get("JWTSECRET"),
			{
				expiresIn: 600
			},
			async (err, token) => {
				if (err) throw err

				await transporter.sendMail({
					from: '"Motion-ridge" <motion-ridge@graphicridge.com>', // sender address
					to: userData.email, // list of receivers
					subject: "Reset password", // Subject line
					text: "Motion Ridge", // plain text body
					html: `
							<html>
								<head>
								<style type="text/css">
								.btn
								{
									padding:10px 15px;
									border-radius:6px;
									color: #F9FAFB;
									background-color:#27272A;
									cursor:pointer;
									text-decoration: none;
								}
								</style>
								</head>
								<body style="height:300px">
								<body>
								<h2>Hello ${userData.firstName} ${userData.lastName}, welcome to motion ridge</h2>
								<h3>Click the button to Reset your password</h3>
								<a class="btn" href="${process.env.REDIRECT_URI}/reset-password/${token}" ><span style="color:white">Click here to reset</span></a>
								</body>
							</html>
				`
				})
			}
		)
		res.status(200).json("sent")
	} catch (error) {
		res.status(500).send("Server Error")
		console.log(error)
	}
})

// @route   POST user/login
// @desc    login user
// @access  public
router.post(
	"/login",
	[
		check("email", "Please Include a Valid Email").isEmail().normalizeEmail().trim(),
		check("password", "Please Enter a password").exists().escape().trim()
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
				config.get("JWTSECRET"),
				{
					expiresIn: 3600000
				},
				(err, token) => {
					if (err) throw err
					res.json({ ...savedUser.dataValues, token })
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
	[check("userName", "Parameter required").exists().escape().trim()],
	async (req, res) => {
		const errors = validationResult(req)

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() })
		}

		const data = req.body
		try {
			const result = await User.findOne({
				where: {
					username: Sequelize.where(
						Sequelize.literal("BINARY username IN ("),
						`'${data.userName}'`,
						Sequelize.literal(")")
					)
				}
			})

			if (result) {
				res.status(200).json(true)
			} else {
				res.status(200).json(false)
			}
		} catch (error) {
			res.status(500).send("Server Error")
			console.log(error)
		}
	}
)

module.exports = router
