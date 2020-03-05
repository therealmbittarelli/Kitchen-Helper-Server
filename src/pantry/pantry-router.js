const express = require("express");
const logger = require("../logger");
const PantryService = require("./pantry-service");
const AccountService = require("../users/users-service");
const requireAuth = require("../middleware/jwt-auth");
const xss = require("xss");
const path = require("path");

const bodyParser = express.json();
const pantryRouter = express.Router();

const serializeIngredient = (ingredient) => {
  return {
    ...ingredient
  };
};

pantryRouter
  .route("/")
  .get(requireAuth, (req, res, next) => {
    let user_id = req.user.id;
    PantryService.getIngredients(req.app.get("db"), user_id)
      .then((ingredients) => {
        if (req.query.q) {
          const filterResults = ingredients.filter((ingredient) => {
            return ingredient.ingredient_name.toLowerCase().includes(req.query.q.toLowerCase());
          });
          res.json(filterResults.map(serializeIngredient));
        } else {
          res
            .status(200)
            .json(ingredients);
        }

      })
      .catch((err) => {
        next(err);
      });
  })

  .post(requireAuth, bodyParser, (req, res, next) => {
    let { ingredient_name, in_stock, notes } = req.body;
    let ingredient_owner = req.user.id;
    const newIngredient = {
      ingredient_name: ingredient_name.toLowerCase(),
      in_stock,
      notes,
      ingredient_owner
    };
    ingredient_name = ingredient_name.trim();

    let isValidIngredientName = PantryService.isValidIngredientInput(ingredient_name);
    let isValidNotes = PantryService.isValidNotesInput(notes);


    if (!isValidIngredientName) {
      return res.status(400).json({ error: "Ingredient name must contain characters and cannot begin or end with spaces" });
    }
    if (!isValidNotes) {
      return res.status(400).json({ error: "Ingredient notes must contain characters and cannot begin or end with spaces" });
    }

    for (const [key, value] of Object.entries(newIngredient)) {
      if (value === null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });
      }
    }
    PantryService.addIngredient(req.app.get("db"), newIngredient)
      .then(ingredient => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${ingredient.id}`))
          .json(serializeIngredient(ingredient));
      })
      .catch((err) => {
        next(err);
      });
  });

pantryRouter
  .route("/:ingredient_id")
  .patch(requireAuth, bodyParser, (req, res, next) => {
    let { id, ingredient_name, in_stock, notes } = req.body;
    let updatedIngredient = { id, ingredient_name, in_stock, notes };
    let ingredientId = req.body.id;

    ingredient_name = ingredient_name.trim();

    let isValidIngredientName = PantryService.isValidIngredientInput(ingredient_name);
    let isValidNotes = PantryService.isValidNotesInput(notes);

    if (!isValidIngredientName) {
      return res.status(400).json({ error: "Ingredient name must contain characters and cannot begin or end with spaces" });
    }
    if (!isValidNotes) {
      return res.status(400).json({ error: "Ingredient notes must contain characters and cannot begin or end with spaces" });
    }

    PantryService.updateIngredient(req.app.get("db"), updatedIngredient, id)
      .then((updatedIngredientResponse) => {
        res
          .status(201)
          .json(updatedIngredientResponse);
      })
      .catch((err) => {
        next(err);
      });
  })
  .delete(requireAuth, (req, res, next) => {
    PantryService.deleteIngredient(
      req.app.get("db"),
      req.params.ingredient_id
    )
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .catch(next);
  });



module.exports = pantryRouter;