const express = require("express");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { checkTokenMiddleware } = require("./middlewares/auth");
const { connect, client } = require("./utils/database");
const app = express();
app.use(express.json());
const port = 3001;

app.get("/", (req, res) => {
  return res.send({
    status: "success",
  });
});

app.get("/links", checkTokenMiddleware, async (req, res) => {
  try {
    if (!req.body.id) {
      return res.status(401).send({
        status: "failed",
        error: "Some fields are missing",
      });
    }
    const response = await client.query(
      "SELECT * FROM links WHERE links.id_user = $1",
      [req.body.id]
    );
    const links = response.rows;
    return res.send({
      status: "success",
      value: links,
    });
  } catch (e) {
    console.error(e);
    return res.status(401).send({
      status: "failed",
      error: e.toString(),
    });
  }
});

app.post("/add-link", checkTokenMiddleware, async (req, res) => {
  try {
    if (!req.body.id || !req.body.description || !req.body.url) {
      return res.status(401).send({
        status: "failed",
        error: "Some fields are missing",
      });
    }
    await client.query(
      "INSERT INTO links (id_user, description, url) VALUES ($1, $2, $3)",
      [req.body.id, req.body.description, req.body.url]
    );
    return res.send({
      status: "success",
    });
  } catch (e) {
    console.error(e);
    return res.status(401).send({
      status: "failed",
      error: e.toString(),
    });
  }
});

app.post("/remove-link", checkTokenMiddleware, async (req, res) => {
  try {
    if (!req.body.id || !req.body.linkId) {
      return res.status(401).send({
        status: "failed",
        error: "Some fields are missing",
      });
    }
    await client.query(
      "DELETE FROM links WHERE links.id = $1 AND links.id_user = $2;",
      [req.body.linkId, req.body.id]
    );
    return res.send({
      status: "success",
    });
  } catch (e) {
    console.error(e);
    return res.status(401).send({
      status: "failed",
      error: e.toString(),
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        message: "Error. Please enter the correct email and password",
      });
    }
    const result = await client.query(
      "SELECT * FROM users WHERE email = lower($1) AND password = crypt($2, password);",
      [req.body.email, req.body.password]
    );
    if (result.rows.length <= 0) {
      return res.status(401).send({
        status: "failed",
        error: "No match",
      });
    }
    const token = jwt.sign(
      {
        id: result.rows[0].id,
        email: req.body.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10 days" }
    );

    return res.json({ access_token: token, status: "success" });
  } catch (e) {
    console.error(e);
    return res.status(401).send({
      status: "failed",
      error: e.toString(),
    });
  }
});

app.post("/register", async (req, res) => {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        message: "Error. Please enter the correct email and password",
      });
    }
    const result = await client.query(
      "INSERT INTO users (email, password) VALUES ($1, crypt($2, gen_salt('bf', 8))) RETURNING id;",
      [req.body.email, req.body.password]
    );

    const token = jwt.sign(
      {
        id: result.rows[0].id,
        email: req.body.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "10 days" }
    );

    return res.json({ access_token: token, status: "success" });
  } catch (e) {
    console.error(e);
    return res.status(401).send({
      status: "failed",
      error: e.toString(),
    });
  }
});

app.post("/delete-account", checkTokenMiddleware, async (req, res) => {
  try {
    if (!req.body.id) {
      return res.status(401).send({
        status: "failed",
        error: "Can't identify you",
      });
    }
    // Delete all links before
    await client.query("DELETE FROM links WHERE links.id_user = $1", [
      req.body.id,
    ]);
    await client.query("DELETE FROM users WHERE users.id = $1", [req.body.id]);
    return res.send({
      status: "success",
    });
  } catch (e) {
    console.error(e);
    return res.status(401).send({
      status: "failed",
      error: e.toString(),
    });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  connect();
});
