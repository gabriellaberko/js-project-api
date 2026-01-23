import mongoose from "mongoose";

const ThoughtSchema = mongoose.Schema({
  message: {
    type: String,
    required: true,
    minlength: 2,
    maxlength: 140
  },
  hearts: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Thought", ThoughtSchema);