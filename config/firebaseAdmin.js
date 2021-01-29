const admin = require("firebase-admin")

const serviceAccount = require("../fireAuthSecurity.json")

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: "https://motion-ridge-developement-default-rtdb.firebaseio.com"
})

const defaultAuth = admin.auth()
const defaultdb = admin.database()

module.exports = { defaultAuth, defaultdb }
