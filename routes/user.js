const express = require("express");
const passport = require("passport");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const router = express.Router();

router.get("/register", function (req, res) {
  res.render("users/register");
});

router.post("/register", catchAsync(async function (req, res, next) {
  try {
    const { username, email, password } = req.body;
    const user = new User({ username, email });
    const registeredUser = await User.register(user, password);
    req.login(registeredUser, function (err) {
      if (err) {
        return next(err);
      }
      req.flash("success", "Welcome to Wanderlust!");
      res.redirect("/listings");
    });
  } catch (error) {
    if (error.name === "UserExistsError") {
      req.flash("error", "That username is already taken.");
      return res.redirect("/register");
    }
    throw error;
  }
}));

router.get("/login", function (req, res) {
  res.render("users/login");
});

router.post(
  "/login",
  passport.authenticate("local", {
    failureFlash: "Invalid username or password.",
    failureRedirect: "/login"
  }),
  function (req, res) {
    req.flash("success", "Welcome back!");
    const redirectUrl = res.locals.returnTo || "/listings";
    delete req.session.returnTo;
    res.redirect(redirectUrl);
  }
);

router.post("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    req.flash("success", "You have logged out.");
    res.redirect("/listings");
  });
});

module.exports = router;
