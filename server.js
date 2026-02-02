import cors from "cors";
import express from "express";
import expressListEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import Thought from "./models/Thought";
import User from "./models/User";
import { seedDatabase } from "./seedDatabase";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt-nodejs";

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value: PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// To be used in routes that should only be accessed by authorized users
const authenticateUser = async (req, res, next) => {
  const user = await User.findOne({ accessToken: req.header("Authorization") });
  if(user) {
    req.user = user;
    next(); // Continue on executing what comes after
  } else {
    res.status(401).json({ loggedOut: true });
  }
};


// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Middleware for authentication
// If there is an accessToken from a logged in user in the request header, find matching user and attach it to the request
app.use(async (req, res, next) => {
  try {
    const accessToken = req.headers.authorization;

    if (accessToken) {
      const matchingUser = await User.findOne({ accessToken: accessToken });
      if (matchingUser) {
        req.user = matchingUser
      } 
    }

    next();

  } catch(error) {
    console.error("Authentication middleware error:", error)
    next(); // Prevent blocking
  }
});


/* --- Error handling to check database connection --- */
app.use((req, res, next) => {
  if(mongoose.connection.readyState === 1) { // 1 is connected
    next(); // Continue on executing what comes after
  } else {
    res.status(503).json({ error: "Service unavailable" });
  }
});


/* ---  Routes --- */

app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app);
  res.json({
    message: "Welcome to the Happy Thoughts API",
    endpoints: endpoints
  });
});


// All thoughts
app.get("/thoughts", async (req, res) => {
  
  try {
    /* --- Functionality for filtering --- */
    const filterCriteria = {}; // To use as argument in Model.find(). Will be a criteria or empty object (thus retrieving all thoughts)
    const { fromDate, minLikes } = req.query;

    //Filter on minimum of likes
    if (minLikes) {
      filterCriteria.hearts = { $gte: Number(minLikes) }; //gte = greater than or equal to
    }

    // Filter from a date
    if (fromDate) {
      filterCriteria.createdAt = { $gte: new Date(fromDate) };
    }

    /* --- Functionality for sorting --- */
    const sortCriteria = {};
    const { sortBy, order } = req.query;
    const sortingOrder = order === "asc" ? 1 : -1;

    // Translate to keep readable query parameters in the URL
    let sort = sortBy;
    if (sortBy === "date") {
      sort = "createdAt";
    }
    if (sortBy === "likes") {
      sort = "hearts";
    }

    if (sort) {
      // Set the key-value pair in the object sortCriteria dynamically - obj[key] = value
      sortCriteria[sort] = sortingOrder; // Set the key to the value of sort and its value to sortingOrder
      if (sort !== "createdAt") {
        sortCriteria.createdAt = -1; // Puts creation date as secondary sorting
      }
    } else {
      sortCriteria.createdAt = -1; // Creation date as default sorting
    }

    const thoughts = await Thought
      .find(filterCriteria)
      .sort(sortCriteria)
      .select("-editToken"); // To exclude editToken from being exposed to users
    ;

    const result = thoughts.map((thought) => {
      const thoughtObj = thought.toObject(); // Convert to JS object (because of Mongoose)
      delete thoughtObj.userId; // remove userId to be  on front-end
      return {
        ...thoughtObj,
        isCreator: req.user && thought.userId?.equals(req.user._id) // For determining edit rights (computed on thought and not thoughtObj that has the uderId removed)
      }
    });
    res.json(result);
  } catch (error) { 
    console.error("GET /thoughts error:", error);
    res.status(500).json({ message: "Failed to fetch thoughts", error: error.message });
  }
});


// Post a thought
app.post("/thoughts", async (req, res) => {
  try {
    const message = req.body.message;

    // Use mongoose model to create a database entry
    const newThought = new Thought({ 
      message,
      userId: req.user ? req.user._id : null  
    });

    const savedThought = await newThought.save();

    res.status(201).json(savedThought);
  } catch(error) {
    res.status(400).json({ 
      message: "Failed to save thought to database", 
      error: error.message 
    });
  }
});


// Delete a thought
app.delete("/thoughts/id/:id", async (req, res) => {
  const id = req.params.id;

  // Error handling for invalid id input
  if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ error: `Invalid id: ${id}` });
  }

  try {
    const deletedThought = await Thought.findByIdAndDelete(id);

    // Error handling for no ID match
    if(!deletedThought) {
      return res.status(404).json({ error: `Thought with id ${id} not found` });
    }

    res.json(deletedThought);

  } catch(error) {
    res.status(500).json({error: error.message});
  }
});


// Update the like count of a thought
app.patch("/thoughts/id/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) { 
      return res.status(400).json({ error: `Invalid id: ${id}` });
    }

    const updatedThought = await Thought.findByIdAndUpdate(
      id,
      { $push: { hearts: { userId: req.user ? req.user._id : null } } }, //Ensures the updated heart count gets returned, and that schema validation also is performed
      { new: true, runValidators: true }
    );
    
    // Error handling for no ID match
    if(!updatedThought) {
      return res.status(404).json({ error: `Thought with id ${id} not found` });
    }

    res.json(updatedThought);

  } catch(error) {
    res.status(500).json({ error: error.message });
  }
});


// Update the message of a thought
app.patch("/thoughts/id/:id/message", async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  // Error handling for invalid id input
  if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ error: `Invalid id: ${id}` });
  }

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      id, 
      { message }, 
      { new: true, runValidators: true} //Ensures the updated message gets returned, and that schema validation also is performed on the new message
    );
    
    // Error handling for no ID match
    if(!updatedThought) {
      return res.status(404).json({error: `Thought with id ${id} not found`});
    }

    res.json(updatedThought);

  } catch(err) {
    res.status(500).json({error: err.message});
  }
});


// Create a new user (sign-up)
app.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Use mongoose model to create a database entry
    const salt = bcrypt.genSaltSync();
    const user = new User({ name, email, password: bcrypt.hashSync(password, salt) });
    const savedUser = await user.save();

    res.status(201).json({
      success: true,
      message: "User created",
      id: user._id,
      accessToken: user.accessToken,
      name: user.name
    });
  } catch(error) {
    res.status(400).json({
      success: false,
      message: "Failed to create user", 
      error: error.errors});
  }
});


// Login
app.post("/sessions", async (req, res) => {
  try{
    const { email, password } = req.body;
    const user = await User.findOne({email: email});

    if(!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid user credentials" });
    }

    res.json({ 
      userId: user._id, 
      accessToken: user.accessToken, 
      name: user.name  
    });

  } catch(error) {
    res.status(500).json({ error: "Server error" });
  }
});


/* --- Authenticated only routes ---*/


// Liked thoughts
app.get("/thoughts/liked", authenticateUser, async (req, res) => {
  try {
    const likedThoughts = await Thought
    .find({ "hearts.userId": req.user._id })
    .sort({ createdAt: -1 });

  res.json(likedThoughts);

  } catch (error) { 
    console.error("GET /thoughts error:", error);
    res.status(500).json({ message: "Failed to fetch liked thoughts", error: error.message });
  }
});


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