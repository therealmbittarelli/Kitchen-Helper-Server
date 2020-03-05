require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");
const { NODE_ENV } = require("./config");
const recipeRouter = require("./recipe/recipes-router");
const pantryRouter = require("./pantry/pantry-router");
const planningRouter = require("./planning/planning-router");
const usersRouter = require("./users/users-router");
const authRouter = require("./auth/auth-router");
const morganOption = NODE_ENV === "production" ? "tiny" : "common";

const app = express();

app.use(morgan(morganOption));
app.use(helmet());
app.use(cors());
app.use(express());

app.use("/api/pantry", pantryRouter);
app.use("/api/recipes", recipeRouter);
app.use("/api/accounts", usersRouter);
app.use("/api/auth", authRouter);
app.use("/api/planner", planningRouter);

app.get("/", (req, res, next) => {
  res.send("Hello, boilerplate!");
});

app.use((error, req, res, next) => {
  let response;
  if (process.env.NODE_ENV === "production") {
    response = { error: { message: "server error" } };
  } else {
    response = { error };
  }
  res.status(500).json(response);
});

module.exports = app;
