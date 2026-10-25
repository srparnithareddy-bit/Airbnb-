const express = require("express");
const Listing = require("../models/listing");
const Review = require("../models/review");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const {
  isLoggedIn,
  isReviewAuthor,
  validateReview
} = require("../middleware");

const router = express.Router({ mergeParams: true });

router.post("/", isLoggedIn, validateReview, catchAsync(async function (req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError("Listing not found.", 404);
  }
  const alreadyReviewed = await Review.exists({
    _id: { $in: listing.reviews },
    author: req.user._id
  });
  if (alreadyReviewed) {
    req.flash("error", "You have already reviewed this listing.");
    return res.redirect(`/listings/${listing._id}`);
  }
  const review = new Review(req.body.review);
  review.author = req.user._id;
  listing.reviews.push(review);
  await review.save();
  await listing.save();
  req.flash("success", "Your review has been added.");
  res.redirect(`/listings/${listing._id}`);
}));

router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(async function (req, res) {
  const listing = await Listing.findByIdAndUpdate(req.params.id, {
    $pull: { reviews: req.params.reviewId }
  });
  if (!listing) {
    throw new ExpressError("Listing not found.", 404);
  }
  await Review.findByIdAndDelete(req.params.reviewId);
  req.flash("success", "Your review has been deleted.");
  res.redirect(`/listings/${listing._id}`);
}));

module.exports = router;
