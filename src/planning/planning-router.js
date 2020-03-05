const express = require("express");
const logger = require("../logger");
const planningService = require("../planning/planning-service");
const AccountService = require("../users/users-service");
const requireAuth = require("../middleware/jwt-auth");
const xss = require("xss");
const path = require("path");

const bodyParser = express.json();
const planningRouter = express.Router();

const serializeMealPlan = mealplan => {
  return {
    ...mealplan
  };
};

planningRouter
  .route("/")
  .get(requireAuth, (req, res, next) => {
    let user_id = req.user.id;
    planningService
      .getMealPlans(req.app.get("db"), user_id)
      .then(mealplans => {
        res.status(200).json(mealplans);
      })
      .catch(err => {
        next(err);
      });
  })
  .get(requireAuth, (req, res, next) => {
    let recipeid = req.params.recipe_Id;
    const knexInstance = req.app.get("db");
    const { id } = req.params;

    let recipeObj = {};
    let recipe_ingredients_id = [];
    let recipe_ingredients = [];
    planningService.getRecipeById(req.app.get("db"), recipeid).then(recipe => {
      if (!recipe) {
        logger.error(`Recipe with id ${recipe.id} not found`);
        return res.status(404).send("Recipe not found");
      } else {
        recipeObj = {
          id: recipe.id,
          title: recipe.title,
          owner: recipe.owner,
          recipe_description: xss(recipe.recipe_description),
          time_to_make: recipe.time_to_make,
          recipe_owner: recipe.recipe_owner
        };
      }
    });
  })
  .post(requireAuth, bodyParser, (req, res, next) => {
    let { title, planned_date, time_to_make, needed_ingredients } = req.body;
    let mealplan_owner = req.user.id;
    const newMealPlan = {
      title,
      planned_date,
      time_to_make,
      needed_ingredients,
      mealplan_owner
    };


    for (const [key, value] of Object.entries(newMealPlan)) {
      if (value === null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });
      }
    }

    planningService
      .addMealPlan(req.app.get("db"), newMealPlan)
      .then(mealplan => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${mealplan.id}`))
          .json(serializeMealPlan(mealplan));
      })
      .catch(err => {
        next(err);
      });
  });

planningRouter
  .route("/:mealplan_owner")
  .patch(requireAuth, bodyParser, (req, res, next) => {
    let { title, planned_date, time_to_make, needed_ingredients } = req.body;
    let updatedMealPlan = {
      title,
      planned_date,
      time_to_make,
      needed_ingredients
    };
    let mealPlanId = req.body.id;

    title = title.trim();
    needed_ingredients = needed_ingredients.trim();

    let isValidTitle = planningService.isValidTitleInput(title);
    let isValidIngredients = planningService.isValidIngredientsInput(needed_ingredients);

    if (!isValidTitle) {
      return res.status(400).json({ error: "Meal plan title must contain characters and cannot begin or end with spaces" });
    }
    if (!isValidIngredients) {
      return res.status(400).json({ error: "Meal plan ingredients must contain characters and cannot begin or end with spaces" });
    }

    planningService
      .updateMealPlan(req.app.get("db"), updatedMealPlan, mealPlanId)
      .then(updatedMealPlanResponse => {
        res.status(201).json({
          id: updatedMealPlanResponse.id,
          title: updatedMealPlanResponse.title,
          owner: updatedMealPlanResponse.owner,
          planned_date: updatedMealPlanResponse.planned_date,
          time_to_make: updatedMealPlanResponse.time_to_make,
          needed_ingredients: updatedMealPlanResponse.needed_ingredients,
          mealplan_owner: updatedMealPlanResponse.mealplan_owner
        });
      })
      .catch(err => {
        next(err);
      });
  })

  .delete(requireAuth, (req, res, next) => {
    planningService
      .deleteMealPlan(req.app.get("db"), req.params.mealplan_owner)
      .then(numRowsAffected => {
        res.status(204).end();
      })
      .then(mealplan => {
        if (mealplan === -1) {
          logger.error(`Mealplan with id ${id} not found`);
          return res.status(404).send("Mealplan not found");
        }
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = planningRouter;
