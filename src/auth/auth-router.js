const express = require("express");
const AuthService = require("./auth-service");
const requireAuth = require("../middleware/jwt-auth");

const authRouter = express.Router();
const jsonParser = express.json();

authRouter
  .post("/login", jsonParser, (req, res, next) => {
    const { user_name, password } = req.body;
    const loginUser = { user_name, password };
    for (const [key, value] of Object.entries(loginUser))
      if (value == null)
        return res.status(400).json({
          error: `Missing ${key} in request body`
        });

    AuthService.getUserWithUserName(req.app.get("db"), loginUser.user_name)
      .then(dbUser => {
        if (!dbUser) {
          return res.status(400).json({
            error: "Incorrect user_name or password"
          });
        }
        return AuthService.comparePasswords(
          loginUser.password,
          dbUser.password
        ).then(compareMatch => {
          if (!compareMatch) {
            return res.status(400).json({
              error: "Incorrect user_name or passwordV2"
            });
          }
          const sub = dbUser.user_name;
          const payload = { user_id: dbUser.id };

          res.send({
            authToken: AuthService.createJwt(sub, payload)
          });
        });
      })
      .catch(next);
  });

authRouter
  .put("/token", requireAuth, (req, res) => {

    const sub = req.user.user_name;
    const payload = {
      user_id: req.user.id,
      name: req.user.first_name,
    };
    res
      .send({
        authToken: AuthService.createJwt(sub, payload),
      });

  });

module.exports = authRouter;
