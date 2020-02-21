/* eslint-disable no-console */
const express = require("express");
const logger = require("../logger");
const recipesService = require("./recipes-service");
const pantryService = require("../pantry/pantry-service")
const AccountService = require("../users/users-service");
const requireAuth = require("../middleware/jwt-auth");
const xss = require("xss");
const path = require("path");

const bodyParser = express.json();
const recipeRouter = express.Router();

const serializeRecipe = recipe => {
  return {
    ...recipe
  };
};

recipeRouter
  .route("/")
  .get(requireAuth, (req, res, next) => {
    //console.log("require auth is", req.user.id);
    let user_id = req.user.id;
    //console.log("req recipe router is", req.user);
    recipesService
      .getAllRecipes(req.app.get("db"), user_id)
      .then(recipes => {
        //console.log("recipes GET is", recipes);
        res.status(200).json(recipes);
      })
      .catch(err => {
        next(err);
      });
  })

  .post(requireAuth, bodyParser, (req, res, next) => {
    //console.log("recipe POST req.body is", req.body);
    let { title, recipe_description, time_to_make, recipe_ingredients } = req.body;
    let recipe_owner = req.user.id;
    let recipeId = "";
    let ingredients = [];
    const newRecipe = { 
      title, 
      recipe_description, 
      time_to_make,
      recipe_owner };
    let ingredientIdArray = [];
    //console.log("new recipe from req is", newRecipe);
    for (const [key, value] of Object.entries(newRecipe)) {
      if (value === null) {
        return res.status(400).json({
          error: { message: `Missing ${key} in request body` }
        });
      }
    }
    recipesService
      .insertRecipe(req.app.get("db"), newRecipe)
      .then(recipe => {
        recipeId = recipe.id;
        //console.log("res is", serializeRecipe(recipe));
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${recipe.id}`))
          .json(serializeRecipe(recipe));
      })
      .then(
        // check if ingredients exist in pantry
        // if it does not, add ingredient to pantry and
        // make in_stock and ingredient owner null
        recipe_ingredients.map(ingredient => {
          let newIngredient = { 
            ingredient_name: ingredient.toLowerCase(), 
            in_stock: null,  
            ingredient_owner: req.user.id };
          pantryService.checkIfExists(req.app.get("db"), newIngredient)
            .then(res => {
              console.log("res is: ", res);
              if (!res[0]) {
                pantryService.addIngredient(req.app.get("db"), newIngredient);
                console.log("added new ingredient")
              }  
            });
        }))
      .then(res => {
        // get all of the ingredient id and add to recipe_ingredients
        ingredients = recipe_ingredients.map(ingred => ingred.toLowerCase());
        console.log("ingredients: ", ingredients);
        pantryService.getIngredientsIds(req.app.get("db"), ingredients, req.user.id)
          .then(result => {
            console.log("result: ", result);
            result.map(ing => {
              let recipeIngredient = {
                recipe_id: recipeId,
                ingredient_id: ing.id,
              }
              
              recipesService.addRecipeIngredient(req.app.get("db"), recipeIngredient);})
            console.log("we made it to the end...");
          })
      })
      .catch(err => {
        next(err);
      });
  });

recipeRouter
  .route("/:recipe_Id")
  .patch(requireAuth, bodyParser, (req, res, next) => {
    let { title, recipe_description, time_to_make } = req.body;
    let updatedRecipe = { title, recipe_description, time_to_make };
    let recipeId = req.body.id;
    //console.log("updatedRecipe is", updatedRecipe);
    //console.log("req PATCH is", req);
    recipesService
      .updateRecipe(req.app.get("db"), updatedRecipe, recipeId)
      .then(updatedRecipeResponse => {
        //console.log("updatedPatch is", updatedRecipeResponse);
        res.status(201).json({
          title: updatedRecipeResponse.title,
          recipe_description: updatedRecipeResponse.recipe_description,
          time_to_make: updatedRecipeResponse.time_to_make
        });
      })
      .catch(err => {
        next(err);
      });
  })
  .delete(requireAuth, (req, res, next) => {
    recipesService
      .deleteRecipe(req.app.get("db"), req.params.recipe_Id)
      .then(recipe => {
        if (recipe === -1) {
          logger.error(`Recipe with id ${id} not found`);
          return res.status(404).send("Recipe not found");
        }
        logger.info(`Recipe with id ${id} has been deleted`);
        res.status(204).end();
      })
      .catch(next);
  })
  .get(requireAuth, (req, res, next) => {
    //let user_id = req.user.id;
    let recipeid = req.params.recipe_Id;
    const knexInstance = req.app.get("db");
    const { id } = req.params;
    // need to retrive recipe info from recipe table
    // then retrieve ingredient ids from recipe_ingredient table
    // then retrieve ingredients using the ingredient ids from ingredient table

    let recipeObj = {};
    let recipe_ingredients_id = [];
    let recipe_ingredients = [];
    // need to retrive recipe info from recipe table
    recipesService
      .getRecipeById(req.app.get("db"), recipeid)
      .then(recipe => {
        if (!recipe) {
          logger.error(`Recipe with id ${recipe.id} not found`);
          return res.status(404).send("Recipe not found");
        } else {
          recipeObj = {
            id: recipe.id,
            title: recipe.title,
            owner: recipe.owner,
            recipe_description: xss(recipe.recipe_description),
            //recipe_ingredients: recipe.recipe_ingredients,
            time_to_make: recipe.time_to_make,
            //date_created: recipe.date_created,
            //created_by: recipe.created_by
          };
          console.log(recipeObj);
        }
      });


    // then retrieve ingredient ids from recipe_ingredient table
    recipesService.getRecipeIngredientsId(req.app.get("db"), recipeid)
      .then(idArr => {
        idArr.map(ingr => recipe_ingredients_id.push(ingr.ingredient_id));
        //console.log(recipe_ingredients_id);
        // then retrieve ingredients using the ingredient ids from ingredient table
        pantryService.getIngredientsByIds(req.app.get("db"), recipe_ingredients_id)
          .then(ingredients => {
            ingredients.map(ingredient => {
              recipe_ingredients.push(ingredient.ingredient_name);
            })
            //console.log(recipe_ingredients);
            recipeObj.recipe_ingredients = recipe_ingredients;
            // console.log(recipeObj);
            //send back final recipe object
            res.json(recipeObj);
          });
      })
      .catch(next);
  });

// recipeRouter.route("/").post(bodyParser, (req, res, next) => {
//   const {
//     title,
//     owner,
//     recipe_description,
//     recipe_ingredients,
//     time_to_make
//   } = req.body;

//   if (!title) {
//     logger.error("Title is required");
//     return res.status(400).send("Title required");
//   }

//   if (!recipe_description) {
//     logger.error("Recipe description is required");
//     return res.status(400).send("Recipe description required");
//   }

//   if (!recipe_ingredients) {
//     logger.error("Recipe ingredients is required");
//     return res.status(400).send("Recipe ingredients required");
//   }

//   if (!time_to_make) {
//     logger.error("Time to make is required");
//     return res.status(400).send("Time to make required");
//   }

//   const recipe = {
//     title,
//     owner,
//     recipe_description,
//     recipe_ingredients,
//     time_to_make
//   };

//   const knexInstance = req.app.get("db");

//   recipesService
//     .insertRecipe(knexInstance, recipe)
//     .then(recipe => {
//       const { id } = recipe;
//       logger.info(`Recipe with id of ${id} was created`);
//       res
//         .status(201)
//         .location(path.posix.join(req.originalUrl, `/${recipe.id}`))
//         .json(recipe);
//     })
//     .catch(next);
// });

module.exports = recipeRouter;
