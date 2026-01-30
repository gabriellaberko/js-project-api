import mongoose from "mongoose";

const ThoughtSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    minlength: 1,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  editToken: {
    type: String,
    default: () => crypto.randomUUID()
  },
  // For logged-in users:
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  }
});

export default mongoose.model("Thought", ThoughtSchema);