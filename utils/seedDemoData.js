const User = require("../models/user");
const Listing = require("../models/listing");
const Review = require("../models/review");
const Reservation = require("../models/reservation");

async function seedDemoData() {
  if (await Listing.exists({})) {
    return;
  }

  const password = "wanderlust123";
  const guest = await User.register(new User({
    username: "demo",
    email: "demo@example.com"
  }), password);
  const host = await User.register(new User({
    username: "demo-host",
    email: "demo-host@example.com"
  }), password);

  const listings = await Listing.insertMany([
    {
      title: "Lakefront cabin with a mountain view",
      description: "A quiet timber cabin with a private deck, lakeside trails, and a fully equipped kitchen. A relaxing base for a weekend in the mountains.",
      image: { url: "https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85", filename: "demo-lakefront-cabin" },
      price: 185,
      location: "Lake Tahoe, California",
      country: "United States",
      owner: host._id
    },
    {
      title: "Bright apartment in the heart of Lisbon",
      description: "A sunny, walkable city apartment near local cafes, the tram, and historic neighborhoods. Enjoy a comfortable living space after a day exploring.",
      image: { url: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85", filename: "demo-lisbon-apartment" },
      price: 125,
      location: "Lisbon",
      country: "Portugal",
      owner: host._id
    },
    {
      title: "Seaside bungalow steps from the beach",
      description: "Wake up to ocean air in this easygoing beach bungalow, with a shaded patio and room to unwind after a day by the water.",
      image: { url: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=85", filename: "demo-seaside-bungalow" },
      price: 210,
      location: "Ubud",
      country: "Indonesia",
      owner: host._id
    },
    {
      title: "Modern hideaway surrounded by forest",
      description: "A compact, thoughtfully designed hideaway with floor-to-ceiling windows and peaceful walking paths right outside the door.",
      image: { url: "https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85", filename: "demo-forest-hideaway" },
      price: 160,
      location: "Bend, Oregon",
      country: "United States",
      owner: host._id
    }
  ]);

  const review = await Review.create({
    body: "A wonderful place to slow down and enjoy the view. The cabin was clean and exactly as described.",
    rating: 5,
    author: guest._id
  });
  listings[0].reviews.push(review._id);
  await listings[0].save();

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 7);
  const checkOut = new Date(checkIn);
  checkOut.setDate(checkOut.getDate() + 3);
  await Reservation.create({
    listing: listings[0]._id,
    guest: guest._id,
    checkIn,
    checkOut,
    guests: 2,
    status: "pending"
  });
}

module.exports = seedDemoData;
