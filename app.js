require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const flash = require("connect-flash");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const User = require("./models/user");
const listingRoutes = require("./routes/listing");
const reviewRoutes = require("./routes/review");
const userRoutes = require("./routes/user");
const reservationRoutes = require("./routes/reservation");
const { saveReturnTo } = require("./middleware");
const ExpressError = require("./utils/ExpressError");
const seedDemoData = require("./utils/seedDemoData");

const app = express();
const port = process.env.PORT || 3000;
const demoMode = process.env.DEMO_MODE === "true";
let mongoUrl = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET
  || (demoMode ? "wanderlust-local-demo-only-session-secret" : undefined);

if (!demoMode && (!mongoUrl || !sessionSecret)) {
  throw new Error("Set MONGODB_URI and SESSION_SECRET in your .env file.");
}

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(__dirname + "/public"));

function configureApplication() {
  // Store sessions in MongoDB instead of Express's temporary memory store.
  app.use(session({
    store: MongoStore.create({
      mongoUrl,
      collectionName: "sessions",
      touchAfter: 24 * 60 * 60
    }),
    name: "wanderlust-session",
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === "production"
    }
  }));

  app.use(flash());
  app.use(passport.initialize());
  app.use(passport.session());
  passport.use(new LocalStrategy(User.authenticate()));
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  // Make login and flash information available to every EJS page.
  app.use(saveReturnTo);
  app.use(function (req, res, next) {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.demoMode = demoMode;
    next();
  });

  app.get("/", function (req, res) {
    res.redirect("/listings");
  });
  app.use("/listings", listingRoutes);
  app.use("/listings/:id/reviews", reviewRoutes);
  app.use("/reservations", reservationRoutes);
  app.use("/", userRoutes);

  app.all("*", function (req, res, next) {
    next(new ExpressError("Page not found.", 404));
  });

  // Show friendly errors without exposing stack traces in production.
  app.use(function (err, req, res, next) {
    const statusCode = err.statusCode || (err.code === "LIMIT_FILE_SIZE" ? 400 : 500);
    const message = statusCode === 500 ? "Something went wrong." : err.message;
    if (statusCode === 500) {
      console.error(err);
    }
    res.status(statusCode).render("error", { message });
  });
}

async function startServer() {
  if (demoMode) {
    const { MongoMemoryServer } = require("mongodb-memory-server");
    const memoryServer = await MongoMemoryServer.create();
    mongoUrl = memoryServer.getUri();
    console.log("Demo mode is using an in-memory database; data resets when the server stops.");
  }

  await mongoose.connect(mongoUrl);
  console.log("Connected to MongoDB");

  if (demoMode) {
    await seedDemoData();
    console.log("Demo accounts: demo / wanderlust123 and demo-host / wanderlust123");
  }

  configureApplication();
  app.listen(port, function () {
    console.log(`Wanderlust is running at http://localhost:${port}`);
  });
}

startServer().catch(function (error) {
  console.error("Could not start Wanderlust:", error.message);
  process.exit(1);
});
