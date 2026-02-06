import express from "express";
import User from "../models/User";
import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt-nodejs";

// Endpoint is /users
const router = express.Router();

// Create a new user (sign-up)
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const salt = bcrypt.genSaltSync();

    // Use mongoose model to create a database entry
    const user = new User({ name, email, password: bcrypt.hashSync(password, salt) });
    await user.save();

    res.status(200).json({
      success: true,
      message: "User created successfully",
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
router.post("/login", async (req, res) => {
  try{
    const { email, password } = req.body;
    const user = await User.findOne({email: email});

    if(!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: "Invalid user credentials" });
    }

    res.json({ 
      success: true,
      message: "Login success",
      userId: user._id, 
      accessToken: user.accessToken, 
      name: user.name  
    });

  } catch(error) {
      res.status(500).json({
      success: false,
      message: "Something went wrong",
      response: error,
    });
  }
});


export default router;