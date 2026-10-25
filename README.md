# Wanderlust

Wanderlust is a beginner-friendly travel listing and booking project built with
Node.js, Express, MongoDB, Mongoose, EJS, Passport, and Cloudinary.

## Requirements

- Node.js 18 or newer
- A MongoDB database (MongoDB Atlas works)
- A Cloudinary account for listing photos

## Run the project in VS Code

1. Open this folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install the dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to a new file named `.env`.
5. Fill in the values in `.env`:
   - `MONGODB_URI`: your MongoDB connection string. In MongoDB Atlas, create a
     database user, allow your development IP address, and copy the Node.js
     connection string from **Connect → Drivers**.
   - `SESSION_SECRET`: a long random string used to sign login sessions.
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_KEY`, and `CLOUDINARY_SECRET`: values
     from the Cloudinary dashboard.
6. Start the server:

   ```bash
   npm run dev
   ```

7. Open `http://localhost:3000` in a browser.

The app creates its collections when data is first saved. Session data is also
stored in MongoDB, so use the same database connection for the app and sessions.

## Main features

- Register, log in, and log out with Passport local authentication.
- Create, edit, and delete listings; only the listing owner can edit or delete.
- Upload listing photos directly to Cloudinary.
- Leave one rating and review per listing; authors can remove their own reviews.
- Request a reservation with check-in and check-out dates and a guest count.
- Listing owners can view and approve or cancel reservation requests.

This is a learning project, not a payment-processing service. Reservation
requests do not charge guests or guarantee availability against concurrent
requests.

## Deploy on Render

1. Push this project to your GitHub repository. Make sure `.env` is not included
   in the repository; Git ignores it.
2. In Render, create a **New Web Service** and connect the GitHub repository.
3. Choose the free instance if it is available for your account. Set the build
   command to `npm install` and the start command to `npm start`.
4. In the service's **Environment** settings, add these variables using the
   values from your own MongoDB Atlas and Cloudinary accounts:
   - `MONGODB_URI`
   - `SESSION_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_KEY`
   - `CLOUDINARY_SECRET`
5. In MongoDB Atlas **Network Access**, add the outbound IP addresses Render
   uses if your Render plan provides static outbound IPs. Otherwise, Atlas
   needs a network rule that allows the Render service to connect; understand
   the security trade-off before changing the access list.
6. Deploy the service and open the Render URL shown on its dashboard.

Never put real credentials in GitHub, source files, screenshots, or chat.
Configure secrets in Render's Environment settings and keep the local `.env`
file private.
