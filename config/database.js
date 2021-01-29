const { Sequelize } = require("sequelize")

const db = new Sequelize("motion-ridge", "root", "", {
	host: "localhost",
	dialect: "mysql"
})

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
