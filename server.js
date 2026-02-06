import cors from "cors";
import express from "express";
import expressListEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import { seedDatabase } from "./seedDatabase";
import dotenv from "dotenv";
dotenv.config();
import { optionalAuth } from "./middlewares/authMiddleware.js";
import thoughtRoutes from "./routes/thoughtRoutes.js";
import userRoutes from "./routes/userRoutes.js";

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value: PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();


// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

app.use(optionalAuth); // Global middleware for authentication - To attach req.user everywhere if there is an accessToken in the request header


/* ---  Routes --- */

app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app);
  res.json({
    message: "Welcome to the Happy Thoughts API",
    endpoints: endpoints
  });
});

// The connections to the different routes with endpoints
app.use("/users", userRoutes);
app.use("/thoughts", thoughtRoutes);


/* --- Connect to Mongo --- */
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl)
  .then(() => { 
    console.log('MongoDB connected');

    // await seedDatabase(); // Temporary seeding (add async & await)

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));