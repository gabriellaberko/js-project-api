import mongoose from "mongoose";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  accessToken : {
    type: String,
    default: () => crypto.randomBytes(128).toString("hex")
  }
});

export default mongoose.model("User", UserSchema);