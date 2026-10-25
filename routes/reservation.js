const express = require("express");
const Reservation = require("../models/reservation");
const Listing = require("../models/listing");
const catchAsync = require("../utils/catchAsync");
const ExpressError = require("../utils/ExpressError");
const { isLoggedIn } = require("../middleware");

const router = express.Router();

router.get("/", isLoggedIn, catchAsync(async function (req, res) {
  const reservations = await Reservation.find({ guest: req.user._id })
    .populate("listing")
    .sort({ createdAt: -1 });
  res.render("reservations/index", { reservations });
}));

router.get("/host", isLoggedIn, catchAsync(async function (req, res) {
  const listings = await Listing.find({ owner: req.user._id }).select("_id");
  const listingIds = listings.map((listing) => listing._id);
  const reservations = await Reservation.find({ listing: { $in: listingIds } })
    .populate("listing")
    .populate("guest")
    .sort({ createdAt: -1 });
  res.render("reservations/host", { reservations });
}));

router.put("/:id/status", isLoggedIn, catchAsync(async function (req, res) {
  const { status } = req.body;
  if (!["approved", "cancelled"].includes(status)) {
    throw new ExpressError("Choose a valid reservation status.", 400);
  }
  const reservation = await Reservation.findById(req.params.id).populate("listing");
  if (!reservation) {
    throw new ExpressError("Reservation not found.", 404);
  }
  if (!reservation.listing.owner.equals(req.user._id)) {
    throw new ExpressError("Only the host can update this reservation.", 403);
  }
  reservation.status = status;
  await reservation.save();
  req.flash("success", `Reservation ${status}.`);
  res.redirect("/reservations/host");
}));

module.exports = router;
