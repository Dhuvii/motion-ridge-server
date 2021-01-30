const Sequelize = require("sequelize")
const db = require("../config/database")

const User = db.define("user", {
	id: {
		type: Sequelize.UUID,
		defaultValue: Sequelize.UUIDV4,
		primaryKey: true
	},
	firstName: {
		type: Sequelize.STRING,
		allowNull: false
	},
	lastName: {
		type: Sequelize.STRING,
		allowNull: false
	},
	userName: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	email: {
		type: Sequelize.STRING,
		allowNull: false,
		unique: true
	},
	password: {
		type: Sequelize.STRING,
		allowNull: false
	},
	subscribed: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	isEmailVerified: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	}
})

module.exports = User
