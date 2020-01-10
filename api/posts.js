const express = require('express')
const router = express.Router()
const { check, validationResult } = require('express-validator')
const auth = require('../middleware/auth')
const Profile = require('../models/Profile')
const Post = require('../models/Post')
const User = require('../models/User')

router.post("/", [auth, [
  check('text', "text is required").not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  } else {
    try {
      const user = await User.findById(req.user.id)
      const {text} = req.body
      const newPost = new Post({
        text,
        profilePic: user.profilePic,
        user: req.user.id,
        name: user.name
      })
      newPost.save()
      res.json(newPost)
    } catch (err) {
      console.error(err.message)
    }

  }
})

//Get all post, private

router.get('/', auth, async (req, res) => {
  try {
    let posts = await Post.find().sort({ date: -1 }) //the most recently first
    res.json(posts)
  } catch (err) {
    console.error(err)
    res.status(500).send('server error')
  }
})

//GET post by id, private
router.get('/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id)
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' })
    }
    res.json(post)
  } catch (err) {
    console.error(err)
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Post not found' })
    } else {
      res.status(500).send('server error')
    }
  }
})

//PUT like
router.put('/like/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id)

    //ver si ya tiene like
    if (post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
      return res.json({ msg: 'Post already liked' })
    } else {
      post.likes.unshift({ user: req.user.id })
      await post.save()
      res.json(post.likes)
    }
  } catch (error) {
    console.error(error)
  }
})

//remove like
router.put('/unlike/:id', auth, async (req, res) => {
  try {
    let post = await Post.findById(req.params.id)

    //ver si ya tiene like
    if (post.likes.filter(like => like.user.toString() === req.user.id).length == 0) {
      return res.json({ msg: 'Post has not been liked yet' })
    } else {

      let removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id)
      post.likes.splice(removeIndex, 1)
      await post.save()
      res.json(post.likes)

    }
  } catch (error) {
    console.error(error)
  }
})

//add comment
router.put("/comment/:id", [auth, [
  check('text', "text is required").not().isEmpty()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  } else {
    try {
      const post = await Post.findById(req.params.id)
      const user = await User.findById(req.user.id)
      const {text} = req.body
      const newComment = {
        text,
        profilePic: user.profilePic,
        user: req.user.id,
        name: user.name
      }
      post.comments.unshift(newComment)
      post.save()
      res.json(post.comments)
    } catch (err) {
      console.error(err.message)
    }
  }
})

module.exports = router