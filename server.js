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


/* ---  ROUTES --- */


app.get("/", (req, res) => {
  const endpoints = expressListEndpoints(app);
  res.send(endpoints);
})


// All messages (with pagination)
app.get("/messages", (req, res) => {

  let messages = [ ...data ]; // To not mutate original array

  /* --- Functionality for sorting --- */
    const { sort, order } = req.query;
    
    if(sort === "date") {
      messages.sort((a,b) => {
        if(order === "desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        } else if(order === "asc") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
      });
    }

    if(sort === "likes") {
      messages.sort((a,b) => {
        if(order === "desc") {
          return b.hearts - a.hearts;
        } else if(order === "asc") {
          return a.hearts - b.hearts;
        }
      });
    }

  /* --- Functionality for pagination --- */
    const page = Number(req.query.page) || 1 ; // Query param
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


//Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

