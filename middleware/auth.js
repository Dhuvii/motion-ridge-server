const jwt = require("jsonwebtoken")
const config = require("config")

module.exports = function (req, res, next) {
	//get the token from the header
	const token = req.header("x-auth-token")

	//check if not token
	if (!token) {
		return res
			.status(401)
			.json({ code: "no-token", msg: "No Token, Authorization Denied" })
	}

	try {
		const decoded = jwt.verify(token, config.get("JWTSECRET"))

		req.user = decoded.user
		next()
	} catch (error) {
		res.status(401).json({ code: "invalid-token", msg: "Token is Not Valid" })
	}
}
