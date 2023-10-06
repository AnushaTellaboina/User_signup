const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Connect to SQLite3 database (in-memory for this example)
const db = new sqlite3.Database(":memory:");

// Create tables for users and posts
db.serialize(() => {
  db.run(
    "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT)"
  );
  db.run(
    "CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY, userId INTEGER, content TEXT)"
  );
});

// User Sign-Up API
app.post("/api/signup", (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ status: 400, message: "Name and email are required." });
  }

  // Check if email already exists in the database
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }

    if (row) {
      return res
        .status(400)
        .json({ status: 400, message: "Email already registered." });
    }

    // Basic email format validation (you can use a library like validator for better validation)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ status: 400, message: "Invalid email format." });
    }

    // Insert user data into the database
    db.run(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email],
      (err) => {
        if (err) {
          return res
            .status(500)
            .json({ status: 500, message: "Internal Server Error" });
        }

        return res
          .status(200)
          .json({ status: 200, message: "Successful user sign-up." });
      }
    );
  });
});

// Create Post API
app.post("/api/posts", (req, res) => {
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res
      .status(400)
      .json({ status: 400, message: "User ID and content are required." });
  }

  // Check if the user exists in the database
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, userRow) => {
    if (err) {
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }

    if (!userRow) {
      return res
        .status(404)
        .json({ status: 404, message: "User ID not found." });
    }

    // Insert post data into the database
    db.run(
      "INSERT INTO posts (userId, content) VALUES (?, ?)",
      [userId, content],
      (err) => {
        if (err) {
          return res
            .status(500)
            .json({ status: 500, message: "Internal Server Error" });
        }

        return res
          .status(200)
          .json({ status: 200, message: "Successfully created." });
      }
    );
  });
});

// Delete Post API
app.delete("/api/deletepost/:postId", (req, res) => {
  const { postId } = req.params;

  // Check if the post exists in the database
  db.get("SELECT * FROM posts WHERE id = ?", [postId], (err, postRow) => {
    if (err) {
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }

    if (!postRow) {
      return res
        .status(404)
        .json({ status: 404, message: "Post ID not found." });
    }

    // Delete the post from the database
    db.run("DELETE FROM posts WHERE id = ?", [postId], (err) => {
      if (err) {
        return res
          .status(500)
          .json({ status: 500, message: "Internal Server Error" });
      }

      return res
        .status(200)
        .json({ status: 200, message: "Successful post deletion." });
    });
  });
});

// Fetch User's Posts API
app.get("/api/posts/:userId", (req, res) => {
  const { userId } = req.params;

  // Check if the user exists in the database
  db.get("SELECT * FROM users WHERE id = ?", [userId], (err, userRow) => {
    if (err) {
      return res
        .status(500)
        .json({ status: 500, message: "Internal Server Error" });
    }

    if (!userRow) {
      return res
        .status(404)
        .json({ status: 404, message: "User ID not found." });
    }

    // Fetch all posts by userId from the database
    db.all(
      "SELECT * FROM posts WHERE userId = ?",
      [userId],
      (err, postRows) => {
        if (err) {
          return res
            .status(500)
            .json({ status: 500, message: "Internal Server Error" });
        }

        if (postRows.length === 0) {
          return res
            .status(404)
            .json({ status: 404, message: "No posts found for this user." });
        }

        return res.status(200).json({ status: 200, posts: postRows });
      }
    );
  });
});

// Default route handler for the root URL
app.get("/", (req, res) => {
  res.send("Welcome to the API!");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
