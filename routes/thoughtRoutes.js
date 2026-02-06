import express from "express";
import mongoose from "mongoose";
import Thought from "../models/Thought";
import { authenticateUser } from "../middlewares/authMiddleware";
import dotenv from "dotenv";
dotenv.config();

// Endpoint is /thoughts
const router = express.Router(); 


// All thoughts
router.get("/", async (req, res) => {
  
  try {
    const { minLikes, sortBy, order } = req.query;
    const sortingOrder = order === "asc" ? 1 : -1;

    // Variable for telling MongoDB how to prepare the data
    const filterAndSort = [];

    // Compute the like count from the hearts array, to use in the filtering
    filterAndSort.push({
      $addFields: {
        likesCount: { $size: { $ifNull: ["$hearts", []] } } // Handle empty/null hearts
      }
    });

    /* --- Functionality for filtering --- */
    if (minLikes) {
      filterAndSort.push({
        $match: { likesCount: { $gte: Number(minLikes) } } //gte = Greater than or equals to
      });
    }

    /* --- Functionality for sorting --- */
    const sortCriteria = {};
    if (sortBy === "date") {
      sortCriteria.createdAt = sortingOrder;
    } else if (sortBy === "likes") {
      sortCriteria.likesCount = sortingOrder;
      sortCriteria.createdAt = -1; // Secondary sort by date
    } else {
      sortCriteria.createdAt = -1; // Default sorting
    }

    filterAndSort.push({ $sort: sortCriteria });

    /// Remove editToken to prevent it being exposed to users
    filterAndSort.push({
      $project: { editToken: 0 } 
    });

    /* --- Execute filter and sorting --- */
    const thoughts = await Thought.aggregate(filterAndSort);

    const result = thoughts.map((thought) => {
      const isCreator = req.user && thought.userId?.equals(req.user._id);
      delete thought.userId; // Remove userId (after isCreator is computed) to prevent it from being exposed on front-end
      return {
        ...thought,
        isCreator
      };
    });
    res.json(result);
  } catch (error) { 
    console.error("GET /thoughts error:", error);
    res.status(500).json({ message: "Failed to fetch thoughts", error: error.message });
  }
});


// Post a thought
router.post("/", async (req, res) => {
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
router.delete("/id/:id", async (req, res) => {
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
router.patch("/id/:id/like", async (req, res) => {
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
router.patch("/id/:id/message", async (req, res) => {
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


/* --- Authenticated only routes ---*/


// Liked thoughts
router.get("/liked", authenticateUser, async (req, res) => {
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


export default router;