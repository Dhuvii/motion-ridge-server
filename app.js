const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")

const db = require("./config/database")

const app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(cors())

app.use("/user", require("./routes/user"))

const PORT = process.env.PORT || 5005

app.get("/", (req, res) => res.send("hii"))

app.listen(PORT, () => console.log(`Server engaged... http://localhost:${PORT}`))
