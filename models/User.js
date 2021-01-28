const Sequelize = require("sequelize")
const db = require("../config/database")

const User = db.define("user", {
	id: {
		type: Sequelize.UUID,
		defaultValue: Sequelize.UUIDV4,
		primaryKey: true
	},
	firstName: {
		type: Sequelize.STRING
	},
	lastName: {
		type: Sequelize.STRING
	},
	userName: {
		type: Sequelize.STRING
	},
	email: {
		type: Sequelize.STRING
	},
	password: {
		type: Sequelize.STRING
	},
	isResetPassword: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	}
})

module.exports = User
