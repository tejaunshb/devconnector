const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");

//Post Model
const Post = require("../../models/Post");
//Profile Model
const Profile = require("../../models/Profile");

//Post validation
const validationPostInput = require("../../validation/post");

//@route   GET api/posts/test
//@desc    Test posts route
//@access  Public

router.get("/test", (req, res) => res.json({ msg: "Post works" }));

//@route   POST api/posts/
//@desc    Create posts Data
//@access  Private

router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validationPostInput(req.body);

    //check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    const newPost = new Post({
      text: req.body.text,
      name: req.body.name,
      avatar: req.body.avatar,
      user: req.user.id
    });
    newPost.save().then(post => res.json(post));
  }
);

//@route   GET api/posts/
//@desc    Get All posts Data
//@access  Public
router.get("/", (req, res) => {
  Post.find()
    .then(posts => res.json(posts))
    .catch(err => res.status(404).json({ nopost: "No Posts Found" }));
});

//@route   GET api/posts/:id
//@desc    Get single posts by id
//@access  Public
router.get("/:id", (req, res) => {
  Post.findById(req.params.id)
    .then(post => res.json(post))
    .catch(err => res.status(404).json({ nopost: "No Post Found By This Id" }));
});

//@route   DELETE api/posts/:id
//@desc    DELETE  posts
//@access  private
router.delete(
  "/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //check for post owner

          if (post.user.toString() !== req.user.id) {
            return res
              .status(403)
              .json({ noauthorized: "User not authorized" });
          }
          post.remove().then(() => res.json({ success: true }));
        })
        .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
    });
  }
);

//@route   POST api/posts/like/:id
//@desc    LIKE the posts
//@access  private
router.post(
  "/like/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //check for post owner
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length > 0
          ) {
            return res
              .status(400)
              .json({ alreadyLike: "User already like this post" });
          }
          // ADD iser id to like array
          post.likes.unshift({ user: req.user.id });
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
    });
  }
);

//@route   POST api/posts/dislike/:id
//@desc    DISLIKE the posts
//@access  private
router.post(
  "/dislike/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOne({ user: req.user.id }).then(profile => {
      Post.findById(req.params.id)
        .then(post => {
          //check for post owner
          if (
            post.likes.filter(like => like.user.toString() === req.user.id)
              .length === 0
          ) {
            return res
              .status(400)
              .json({ alreadyLike: "You have not yet like this post" });
          }
          // Get Remove Index
          const removeIndex = post.likes
            .map(item => item.user.toString())
            .indexOf(req.user.id);

          post.likes.splice(removeIndex, 1);
          post.save().then(post => res.json(post));
        })
        .catch(err => res.status(404).json({ postnotfound: "No Post Found" }));
    });
  }
);

//@route   POST api/posts/comment/:id
//@desc    comment the posts
//@access  private
router.post(
  "/comment/:id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validationPostInput(req.body);

    //check validation
    if (!isValid) {
      return res.status(400).json(errors);
    }
    Post.findById(req.params.id)
      .then(post => {
        const newComment = {
          text: req.body.text,
          name: req.body.name,
          avatar: req.body.avatar,
          user: req.user.id
        };

        //add to comment arrray
        post.comments.unshift(newComment);
        // Save comment
        post.save().then(post => res.json(post));
      })
      .catch(err => res.json(404).json({ nopostfound: "No post found" }));
  }
);

//@route   DELETE api/posts/comment/:id/:comment_id
//@desc    DELETE comment from the posts
//@access  private
router.delete(
  "/comment/:id/:comment_id",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Post.findById(req.params.id)
      .then(post => {
        //check if post exist
        if (
          post.comments.filter(
            comment => comment._id.toString() === req.params.comment_id
          ).length === 0
        ) {
          return res
            .status(404)
            .json({ commentnotexist: "Comment does not exist" });
        }
        const removeIndex = post.comments
          .map(item => item._id.toString())
          .indexOf(req.params.comment_id);

        post.comments.splice(removeIndex, 1);
        // Save comment
        post.save().then(post => res.json(post));
      })
      .catch(err => res.json(404).json({ nopostfound: "No post found" }));
  }
);
module.exports = router;
