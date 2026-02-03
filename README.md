# Happy Thoughts API 💭

This repository contains the backend API for Happy Thoughts, built with Node.js, Express, and MongoDB. The API handles authentication, authorization, data validation, and all CRUD operations for thoughts and users.

The API is fully RESTful and deployed to Render.

## Live Site: https://happysharing.netlify.app/

---

## Features

- User authentication (sign up & login)
- Password hashing with bcrypt
- Token-based authorization
- Create, read, update & delete thoughts
- Allow anonymous posting
- Like thoughts (authenticated & anonymous)
- Track which users liked which thoughts
- Fetch thoughts liked by the logged-in user
- Filtering & sorting thoughts: By date and number of likes
- Input validation & error handling
- Secure routes for authenticated actions only

---

## Tech Stack

- Node.js
- Express
- MongoDB
- Mongoose
- bcrypt
- RESTful API design
- Render (deployment)
