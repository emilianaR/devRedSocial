const express = require('express')
const connectDB = require('./config/db')
const cors = require('cors')

const app = express()

app.get('/', (req, res) => res.send('Running'));

const PORT = process.env.PORT || 5000 //esto es para heroku, localmente corre en 5000

app.listen(PORT, () => console.log('app started on port '+ PORT))

//CORS
app.use(cors())

//connect database
connectDB();

//init  Middleware
app.use(express.json({extended: false}))

//routes
app.use('/api/users', require('./api/users'))
app.use('/api/auth', require('./api/auth'))
app.use('/api/profile', require('./api/profile'))
app.use('/api/posts', require('./api/posts'))

