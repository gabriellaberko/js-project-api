import cors from "cors";
import express from "express";
import expressListEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import Thought from "./models/Thought";
import { seedDatabase } from "./seedDatabase";
import dotenv from "dotenv";
dotenv.config();

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value: PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());


/* --- Error handling to check database connection --- */
app.use((req, res, next) => {
  if(mongoose.connection.readyState === 1) { // 1 is connected
    next(); // Continue on executing what comes after
  } else {
    res.status(503).json({error: "Service unavailable"});
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
  
  /* --- Functionality for filtering --- */
    const filterCriteria = {}; // To use as argument in Model.find(). Will be a criteria or object (thus retrieving all thoughts)
    const { fromDate, minLikes } = req.query;

    //Filter on minimum of likes
    if(minLikes){
      filterCriteria.hearts = { $gte: Number(minLikes) }; //gte = greater than or equal to
    }

    // Filter from a date
    if(fromDate) {
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

    if(sort){
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
    .select("-editToken") // to exclude editToken from being exposed to users
  ;
  res.json(thoughts);
});


// Post a thought
app.post("/thoughts", async (req, res) => {
  // Retrieve the information sent by the client to our API endpoint
  const message = req.body.message;
  // Use our mongoose model to create the database entry
  const thought = new Thought({ message });

  try {
    const savedThought = await thought.save();
    res.status(201).json(savedThought);
  } catch(err) {
    res.status(400).json({message: "Failed to save thought to database", error: err.message});
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
      return res.status(404).json({error: `Thought with id ${id} not found`});
    }

    res.json(deletedThought);

  } catch(err) {
    res.status(500).json({error: err.message});
  }
});


// Update the like count of a thought
app.patch("/thoughts/id/:id/like", async (req, res) => {
  const { id } = req.params;
  const { hearts } = req.body;

  // Error handling for invalid id input
  if (!mongoose.Types.ObjectId.isValid(id)) {
  return res.status(400).json({ error: `Invalid id: ${id}` });
  }

  try {
    const updatedThought = await Thought.findByIdAndUpdate(
      id, 
      { hearts }, 
      { new: true, runValidators: true} //Ensures the updated heart count gets returned, and that schema validation also is performed on the new message
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