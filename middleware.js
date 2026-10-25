const Joi = require("joi");
const Listing = require("./models/listing");
const Review = require("./models/review");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require("./utils/catchAsync");

const listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().min(3).max(100).required(),
    description: Joi.string().trim().min(10).max(3000).required(),
    price: Joi.number().min(1).max(1000000).required(),
    location: Joi.string().trim().min(2).max(100).required(),
    country: Joi.string().trim().min(2).max(100).required()
  }).required()
});

const reviewSchema = Joi.object({
  review: Joi.object({
    body: Joi.string().trim().min(3).max(1000).required(),
    rating: Joi.number().integer().min(1).max(5).required()
  }).required()
});

const reservationSchema = Joi.object({
  reservation: Joi.object({
    checkIn: Joi.date().iso().required(),
    checkOut: Joi.date().iso().greater(Joi.ref("checkIn")).required(),
    guests: Joi.number().integer().min(1).max(20).required()
  }).required()
});

function validate(schema) {
  return function (req, res, next) {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const message = error.details.map((detail) => detail.message).join(", ");
      return next(new ExpressError(message, 400));
    }
    next();
  };
}

// Save the page the visitor wanted so login can send them back afterward.
function saveReturnTo(req, res, next) {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
}

function isLoggedIn(req, res, next) {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash("error", "Please log in before continuing.");
    return res.redirect("/login");
  }
  next();
}

const isListingOwner = catchAsync(async function (req, res, next) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError("Listing not found.", 404);
  }
  if (!listing.owner.equals(req.user._id)) {
    req.flash("error", "You do not have permission to do that.");
    return res.redirect(`/listings/${listing._id}`);
  }
  res.locals.listing = listing;
  next();
});

const isReviewAuthor = catchAsync(async function (req, res, next) {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    throw new ExpressError("Review not found.", 404);
  }
  if (!review.author.equals(req.user._id)) {
    req.flash("error", "You can only delete your own reviews.");
    return res.redirect(`/listings/${req.params.id}`);
  }
  next();
});

module.exports = {
  validateListing: validate(listingSchema),
  validateReview: validate(reviewSchema),
  validateReservation: validate(reservationSchema),
  saveReturnTo,
  isLoggedIn,
  isListingOwner,
  isReviewAuthor
};
