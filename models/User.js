import mongoose from "mongoose";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    unique: true,
    required: true,
    minlength: 6,
    maxlength: 254
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