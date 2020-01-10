const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')
const Profile = require('../models/Profile')
const { check, validationResult } = require('express-validator')

//auth Get route to profile
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user', ['name', 'profilePic'])

    if (!profile) {
      return res.status(400).json({ msg: "There is no profile for this user" })
    } else {
      res.json(profile)
    }
  } catch (err) {
    console.error(err.message)
    res.status(500).json({ msg: "server error" })
  }
})

// Create profile POST route
router.post('/', [auth, [
  check('workPosition', 'work position is required').not().isEmpty(),
  check('skills', 'skills are required').not().isEmpty()
]], async (req, res) => {

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  } else {
    //build profile object

    const {
      workPosition,
      company,
      website,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin,
      bio
    } = req.body

    const profileInfo = {}
    profileInfo.user = req.user.id
    profileInfo.workPosition = workPosition
    if (company) profileInfo.company = company
    if (website) profileInfo.website = website
    if (skills) profileInfo.skills = skills.split(',').map(skill => skill.trim())
    if (bio) profileInfo.bio = bio

    profileInfo.social = {}
    if (facebook) profileInfo.social.facebook = facebook
    if (twitter) profileInfo.social.twitter = twitter
    if (instagram) profileInfo.social.instagram = instagram
    if (linkedin) profileInfo.social.linkedin = linkedin
    if (youtube) profileInfo.social.youtube = youtube

    try {
      let profile = await Profile.findOne({ user: req.user.id })

      if (profile) {
        //update
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileInfo }, //mongo db update operator, replaces values
          {
            new: true,
            useFindAndModify: false
          },
        )
        return res.json(profile)


      } else {
        //create
        profile = new Profile(profileInfo)
        await profile.save()
        res.json(profile)
      }
    } catch (err) {
      console.error(err.message)
    }
  }
})

// GET public get all profiles
router.get('/', (req, res) => {
  Profile.find().populate('user', ['name', 'profilePic'])
    .then(profiles => {
      res.status(200).json({ profiles })
    })
    .catch(err => {
      res.status(500).json({ error: err })
    })
})

//GET public api/profile/user/:user_id
router.get('/user/:user_id', (req, res) => {
  Profile.findOne({ user: req.params.user_id }).populate('user', ['name', 'profilePic'])
    .then(profile => {
      if (!profile) return res.status(400).json({ msg: "Profile not found" })
      res.status(200).json({ profile })
    })
    .catch(err => {
      res.status(500).json({ error: err })
    })
})

//DELETE private api/profile
router.get('/', auth, async (req, res) => {
  try {
    await Profile.findOneAndRemove({ user: req.user.id })
    res.status(200).json({ msg: "profile deleted" })
  } catch (err) {
    res.status(500).json({ error: err })
  }
})

//PUT private api/profile/experience
router.put('/experience', [
  auth, [
    check('tittle', "A tittle is required").not().isEmpty(),
    check('company', "company name is required").not().isEmpty(),
    check('from', "date of biginning").not().isEmpty(),
    check('current', "Actual situation is required").not().isEmpty()
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  } else {

    const { tittle, company, from, current, to, location, description } = req.body

    const experienceInfo = {}
    experienceInfo.tittle = tittle
    experienceInfo.company = company
    experienceInfo.from = from
    experienceInfo.current = current
    if (to) experienceInfo.to = to
    if (location) experienceInfo.location = location
    if (description) experienceInfo.description = description

    try {
      let profile = await Profile.findOne({ user: req.user.id })
      profile.experience.unshift(experienceInfo) // same as push but it puts it at the beginning
      await profile.save()

      res.json(profile)

    } catch (err) {
      console.error(err.message)
    }
  }
})

//DELETE private api/profile/experience/:exp_id
router.delete('experience/:exp_id', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id })
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id)
    profile.experience.splice(removeIndex, 1)
    await profile.save()

  } catch (err) {
    console.error(err.message)
  }
})

module.exports = router