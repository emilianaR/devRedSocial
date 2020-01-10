const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')
const jwtToken = config.get('jwtToken')

//route  GET api/users
router.get('/', (req, res) => {
  User.find()
    .then(doc => {
      res.status(200).json({ users: doc })
    })
    .catch(err => {
      res.status(500).json({ error: err })
    })
});

//registeres POST api/users
router.post('/', [
  check('email', 'Please include a valid email').isEmail(),
  check('name', 'A name is required').not().isEmpty(),
  check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, password, profilePic } = req.body;

  try {
    let user = await User.findOne({ email })

    if (user) {
      res.status(400).json({ errors: [{ msg: "User already exists" }] });
    } else {
      if (profilePic === null) {
        profilePic = gravatar.url(email, {
          s: '200',
          r: 'pg',
          d: 'mm'
        })
      }
      user = new User({
        name,
        email,
        password,
        profilePic
      })

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(
        payload,
        jwtToken,
        { expiresIn: 36000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      )
    }

  } catch (err) {
    console.error(err.message)
    res.status(500).send('server error')
  }
})

module.exports = router