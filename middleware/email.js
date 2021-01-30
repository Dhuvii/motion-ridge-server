const nodemailer = require("nodemailer")

let transporter = nodemailer.createTransport({
	host: "mail.graphicridge.com",
	port: 587,
	secure: false, // true for 465, false for other ports
	auth: {
		user: "motion-ridge@graphicridge.com", // generated ethereal user
		pass: "$ao8YR7.t1F+" // generated ethereal password
	},
	tls: {
		rejectUnauthorized: false
	}
})

// send mail with defined transport object
/* let info = await transporter.sendMail({
	from: '"Fred Foo 👻" <foo@example.com>', // sender address
	to: "bar@example.com, baz@example.com", // list of receivers
	subject: "Hello ✔", // Subject line
	text: "Hello world?", // plain text body
	html: "<b>Hello world?</b>" // html body
}) */

module.exports = transporter
