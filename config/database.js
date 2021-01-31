const { Sequelize } = require("sequelize")

const db = new Sequelize(
	process.env.DB_NAME,
	process.env.DB_USERNAME,
	process.env.DB_PASSWORD,
	{
		host: process.env.DB_HOST,
		dialect: "mysql"
	}
)

async function getAuthenicate() {
	try {
		await db.authenticate()
		console.log("Database Access Granted...")
	} catch (error) {
		console.error("Database Access Denied:", error)
	}
}

getAuthenicate()

db.sync()

module.exports = db
