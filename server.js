import cors from "cors";
import express from "express";
import data from "./data.json";
import expressListEndpoints from "express-list-endpoints";
import mongoose from "mongoose";
import Thought from "./models/Thought";
import { seedDatabase } from "./seedDatabase";

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
    const { fromDate, minLikes } = req.query;
    const filter = {}; // To use as argument in Model.find(). Will be a criteria or object (thus retrieving all thoughts)

    //Filter on minimum of likes
    if(minLikes){
      filter.hearts = { $gte: Number(minLikes) }; //gte = greater than or equal to
    }

    // Filter from a date
    if(fromDate) {
      filter.createdAt = { $gte: new Date(fromDate) }; 
    }
  
  const thoughts = await Thought.find(filter);
  res.json(thoughts);
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


// Update the message of a thought
app.patch("/thoughts/id/:id", async (req, res) => {
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


app.post("/thoughts", async (req, res) => {
  // Retrieve the information sent by the client to our API endpoint
  const message = req.body.message;
  // Use our mongoose model to create the database entry
  const thought = new Thought({ message });

  try {
    const savedThought = await thought.save();
    res.status(200).json(savedThought);
  } catch(err) {
    res.status(400).json({message: "Failed to save thought to database", error: err.errors});
  }
});


/* --- Old routes for statix json file --- */

// All messages (with pagination)
app.get("/messages", (req, res) => {

  let messages = [ ...data ]; // To not mutate original array

  /* --- Functionality for filtering --- */
    const { fromDate, minLikes } = req.query;

    if(fromDate) {
      messages = messages.filter((message) => message.createdAt.slice(0, 10) > fromDate);
    }
    if(minLikes) {
      messages = messages.filter((message) => message.hearts >= Number(minLikes));
    }

  /* --- Functionality for sorting --- */
    const { sort, order } = req.query;
    
    if(sort === "date") {
      messages.sort((a,b) => {
        if(order === "asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        } else {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // Default to desc
        }
      });
    }

    if(sort === "likes") {
      messages.sort((a,b) => {
        if(order === "asc") {
          return a.hearts - b.hearts;
        } else {
          return b.hearts - a.hearts; // Default to desc
        }
      });
    }

  /* --- Functionality for pagination --- */
    const page = Number(req.query.page) || 1;
    const numOfTotalMessages = messages.length;
    const messagesPerPage = 10;
    const numOfPages = Math.ceil(numOfTotalMessages / messagesPerPage); // Always round the result up, so there will be an extra page for any remainder

    // Define where to slice the array of messages for each page
    const start = (page - 1) * messagesPerPage;
    const end = start + messagesPerPage;

    const pageResults = messages.slice(start, end);
    res.json({page, numOfPages, numOfTotalMessages, pageResults});
});


// Messages for a specific date
app.get("/messages/date/:date", (req, res) => {
  const date = req.params.date;
  const messagesFromDate = data.filter((message) => message.createdAt.slice(0, 10) === date); // createdAt needs to match format "YYYY-MM-DD"
  res.json(messagesFromDate);
});


// Message with a specific ID
app.get("/messages/id/:id", (req, res) => {
  const id = req.params.id;
  const message = data.find((message) => message._id === id);
  
  if(!message) {
    return res.status(404).json({
      error: `Message with id ${id} not found`
    });
  }

  res.json(message);
});


/* --- Connect to Mongo --- */
const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/thoughts";
mongoose.connect(mongoUrl)
  .then(async () => { 
    console.log('MongoDB connected');

    
    await seedDatabase(); // Temporary seeding (add async & await)

    // Start the server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch(err => console.error('MongoDB connection error:', err));