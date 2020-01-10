const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const jwtToken = config.get('jwtToken')

//route  GET api/auth
router.get('/', auth, (req, res) => res.send('auth route'));

//route POST api/auth
router.post('/', [
  check('email', "Enter a valid email").isEmail(),
  check('password', "Enter a password").not().isEmpty()
], async (req, res) => {

  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body
  try {
    let user = await User.findOne({ email })

    if (!user) {
      res.status(400).json({ errors: [{ msg: "can't find user with that email" }] })
    } else if (!bcrypt.compareSync(password, user.password)) {
      res.status(400).json({ errors: [{ msg: "Incorrect password" }] })
    } else {
      const payload = {
        user: {
          id: user.id,
          img: user.profilePic,
          name: user.name
        }
      }
      jwt.sign(
        payload,
        jwtToken,
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({
            success: true,
            token: token
          });
        }
      )
    }
    
  } catch (err) {
    console.log(err.message)
    res.status(500).json({msg: "server error"})
  }
})

module.exports = router