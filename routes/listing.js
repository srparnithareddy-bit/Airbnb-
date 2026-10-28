const express = require("express");
const multer = require("multer");
const Listing = require("../models/listing");
const Reservation = require("../models/reservation");
const { uploadImage, deleteImage } = require("../config/cloudinary");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const {
  isLoggedIn,
  isListingOwner,
  validateListing,
  validateReservation
} = require("../middleware");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, callback) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new ExpressError("Choose a JPG, PNG, or WebP image.", 400));
    }
    callback(null, true);
  }
});

router.get("/", catchAsync(async function (req, res) {
  const listings = await Listing.find({}).populate("owner");
  res.render("listings/index", { listings });
}));

router.get("/new", isLoggedIn, function (req, res) {
  res.render("listings/new");
});

router.post("/", isLoggedIn, upload.single("image"), validateListing, catchAsync(async function (req, res) {
  if (!req.file) {
    throw new ExpressError("Please choose an image for your listing.", 400);
  }
  const image = await uploadImage(req.file);
  const listing = new Listing(req.body.listing);
  listing.owner = req.user._id;
  listing.image = image;
  try {
    await listing.save();
  } catch (error) {
    await deleteImage(image.filename);
    throw error;
  }
  req.flash("success", "Your listing has been created.");
  res.redirect(`/listings/${listing._id}`);
}));

router.get("/:id/edit", isLoggedIn, isListingOwner, function (req, res) {
  res.render("listings/edit", { listing: res.locals.listing });
});

router.put("/:id", isLoggedIn, isListingOwner, upload.single("image"), validateListing, catchAsync(async function (req, res) {
  const listing = res.locals.listing;
  Object.assign(listing, req.body.listing);
  if (req.file) {
    const oldImageFilename = listing.image.filename;
    const newImage = await uploadImage(req.file);
    listing.image = newImage;
    try {
      await listing.save();
    } catch (error) {
      await deleteImage(newImage.filename);
      throw error;
    }
    await deleteImage(oldImageFilename);
  } else {
    await listing.save();
  }
  req.flash("success", "Your listing has been updated.");
  res.redirect(`/listings/${listing._id}`);
}));

router.delete("/:id", isLoggedIn, isListingOwner, catchAsync(async function (req, res) {
  const listing = res.locals.listing;
  await Reservation.deleteMany({ listing: listing._id });
  await deleteImage(listing.image.filename);
  await Listing.findOneAndDelete({ _id: listing._id });
  req.flash("success", "Your listing has been deleted.");
  res.redirect("/listings");
}));

router.get("/:id", catchAsync(async function (req, res) {
  const listing = await Listing.findById(req.params.id)
    .populate("owner")
    .populate({ path: "reviews", populate: { path: "author" } });
  if (!listing) {
    throw new ExpressError("Listing not found.", 404);
  }
  res.render("listings/show", { listing });
}));

router.post("/:id/reservations", isLoggedIn, validateReservation, catchAsync(async function (req, res) {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    throw new ExpressError("Listing not found.", 404);
  }
  if (listing.owner.equals(req.user._id)) {
    req.flash("error", "You cannot book your own listing.");
    return res.redirect(`/listings/${listing._id}`);
  }
  const { checkIn, checkOut, guests } = req.body.reservation;
  const reservation = new Reservation({
    listing: listing._id,
    guest: req.user._id,
    checkIn,
    checkOut,
    guests
  });
  await reservation.save();
  req.flash("success", "Your reservation request has been sent to the host.");
  res.redirect("/reservations");
}));

module.exports = router;
