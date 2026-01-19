import cors from "cors";
import express from "express";
import data from "./data.json";
import expressListEndpoints from "express-list-endpoints";

// Defines the port the app will run on. Defaults to 8080, but can be overridden
// when starting the server. Example command to overwrite PORT env variable value:
// PORT=9000 npm start
const port = process.env.PORT || 8080;
const app = express();

// Add middlewares to enable cors and json body parsing
app.use(cors());
app.use(express.json());

// Start defining your routes here
app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app);
  res.send(endpoints);
})

// All messages
app.get("/messages", (req, res) => {
  res.json(data);
});

// Messages for a specific date
app.get("/messages/date/:date", (req, res) => {
  const date = req.params.date;
  const messagesFromDate = data.filter((message) => message.createdAt.slice(0, 10) === date); // createdAt needs to match format "YYYY-MM-DD"
  res.json(messagesFromDate);
});

// Message with a specific ID
app.get("/message/id/:id", (req, res) => {
  const id = req.params.id;
  const messageOfId = data.filter((message) => message._id === id);
  res.json(messageOfId);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

