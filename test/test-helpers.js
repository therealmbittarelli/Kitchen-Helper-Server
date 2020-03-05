const knex = require("knex");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");




/**
 * create a knex instance connected to postgres
 * @returns {knex instance}
 */
function makeKnexInstance() {
  return knex({
    client: "pg",
    connection: process.env.TEST_DATABASE_URL,
  });
}

/**
 * create a knex instance connected to postgres
 * @returns {array} of user objects
 */
function makeUsersArray() {
  return [
    {
      id: 1,
      user_name: "test-user-1",
      first_name: "Test user 1",
      password: "password",
    },
    {
      id: 2,
      user_name: "test-user-2",
      first_name: "Test user 2",
      password: "password",
    },
  ];
}

function makeMealPlans() {
  [
    {
      id: 1,
      title: "bread",
      planned_date: "2/14/2020",
      time_to_make: "30",
      needed_ingredients: "potatoes",
      mealplan_owner: 1
    },
    {
      id: 2,
      title: "cheese",
      planned_date: "2/14/2020",
      time_to_make: "30",
      needed_ingredients: "potatoes",
      mealplan_owner: 1
    },
    {
      id: 3,
      title: "bread",
      planned_date: "2/14/2020",
      time_to_make: "30",
      needed_ingredients: "potatoes",
      mealplan_owner: 1
    },
    {
      id: 4,
      title: "cheese",
      planned_date: "2/14/2020",
      time_to_make: "30",
      needed_ingredients: "potatoes",
      mealplan_owner: 1
    },
  ];
}

function makeIngredients() {
  return [
    {
      ingredient_name: "Test Ingredient 1",
      in_stock: "in-stock",
      notes: "Test notes 1",
      ingredient_owner: 1
    },
    {
      ingredient_name: "Test Ingredient 2",
      in_stock: "in-stock",
      notes: "Test notes 2",
      ingredient_owner: 1
    },
    {
      ingredient_name: "Test Ingredient 3",
      in_stock: "in-stock",
      notes: "Test notes 3",
      ingredient_owner: 2
    },
    {
      ingredient_name: "Test Ingredient 4",
      in_stock: "in-stock",
      notes: "Test notes 4",
      ingredient_owner: 2
    }
  ];
}

function makeRecipeIngredients() {
  return [
    {
      recipe_id: 1,
      ingredient_id: 1,
    },
    {
      recipe_id: 1,
      ingredient_id: 2,
    },
    {
      recipe_id: 2,
      ingredient_id: 3,
    },
    {
      recipe_id: 2,
      ingredient_id: 4,
    },
    {
      recipe_id: 3,
      ingredient_id: 1,
    },
    {
      recipe_id: 3,
      ingredient_id: 2,
    },
    {
      recipe_id: 4,
      ingredient_id: 3,
    },
    {
      recipe_id: 4,
      ingredient_id: 4,
    },

  ]
}

function makeRecipes() {
  return [
    {
      title: "Test Recipe 1",
      //recipe_ingredients: ["Test Ingredient 1", "Test Ingredient 2"],
      recipe_description: ["instruction 1.1", "instruction 1.2"],
      time_to_make: 21,
      recipe_owner: 1,
    },
    {
      title: "Test Recipe 2",
      //recipe_ingredients: ["Test Ingredient 3", "Test Ingredient 4"],
      recipe_description: ["instruction 2.1", "instruction 2.2"],
      time_to_make: 22,
      recipe_owner: 1,
    },
    {
      title: "Test Recipe 3",
      //recipe_ingredients: ["Test Ingredient 1", "Test Ingredient 2"],
      recipe_description: ["instruction 3.1", "instruction 3.2"],
      time_to_make: 23,
      recipe_owner: 2,
    },
    {
      title: "Test Recipe 4",
      //recipe_ingredients: ["Test Ingredient 3", "Test Ingredient 4"],
      recipe_description: ["instruction 4.1", "instruction 4.2"],
      time_to_make: 24,
      recipe_owner: 2,
    }
  ]
}


/**
 * make a bearer token with jwt for authorization header
 * @param {object} user - contains `id`, `username`
 * @param {string} secret - used to create the JWT
 * @returns {string} - for HTTP authorization header
 */
function makeAuthHeader(user, secret = process.env.JWT_SECRET) {
  const token = jwt.sign({ user_id: user.id }, secret, {
    subject: user.user_name,
    algorithm: "HS256",
  });
  return `Bearer ${token}`;
}

/**
 * remove data from tables and reset sequences for SERIAL id fields
 * @param {knex instance} db
 * @returns {Promise} - when tables are cleared
 */
function cleanTables(db) {
  return db.transaction(trx =>
    trx.raw(
      `TRUNCATE
        "recipe_ingredients",
        "ingredients",
        "recipes",
        "mealplans",
        "accounts"
        `
    )
      .then(() =>
        Promise.all([
          trx.raw("ALTER SEQUENCE recipe_ingredients_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE ingredients_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE recipes_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE mealplans_id_seq minvalue 0 START WITH 0"),
          trx.raw("ALTER SEQUENCE accounts_id_seq minvalue 0 START WITH 0"),
          trx.raw("SELECT setval('recipe_ingredients_id_seq', 0)"),
          trx.raw("SELECT setval('ingredients_id_seq', 0)"),
          trx.raw("SELECT setval('recipes_id_seq', 0)"),
          trx.raw("SELECT setval('mealplans_id_seq', 0)"),
          trx.raw("SELECT setval('accounts_id_seq', 0)")
        ])
      )
  );
}

/**
 * insert users into db with bcrypted passwords and update sequence
 * @param {knex instance} db
 * @param {array} users - array of user objects for insertion
 * @returns {Promise} - when users table seeded
 */
async function seedUsers(db, users) {

  await db.transaction(async trx => {
    await trx.into("accounts").insert(users);
  });
}

async function seedMealPlans(db, users, mealplans) {
  await db.transaction(async trx => {
    await trx.into("accounts").insert(users);
    await trx.into("mealplans").insert(mealplans)
  })
}

/**
 * seed the databases with ingredients and update sequence counter
 * @param {knex instance} db
 * @param {array} users - array of user objects for insertion
 * @param {array} ingredients - array of ingredients objects for insertion
 * @returns {Promise} - when all tables seeded
 */
async function seedPantry(db, users, ingredients) {

  await db.transaction(async trx => {
    await trx.into("accounts").insert(users);
    await trx.into("ingredients").insert(ingredients);
  });
}

/**
* seed the databases with recipes and update sequence counter
* @param {knex instance} db
* @param {array} users - array of user objects for insertion
* @param {array} recipes - array of recipe objects for insertion
* @returns {Promise} - when all tables seeded
*/
async function seedRecipes(db, users, recipes, ingredients, recipeIngredients) {
  // await seedUsers(db, users);

  await db.transaction(async trx => {
    await trx.into("accounts").insert(users);
    await trx.into("recipes").insert(recipes);

  });



}




module.exports = {
  makeKnexInstance,
  makeUsersArray,
  makeRecipes,
  makeIngredients,
  makeAuthHeader,
  makeRecipeIngredients,
  cleanTables,
  seedUsers,
  seedPantry,
  seedRecipes,
  makeMealPlans,
  seedMealPlans

};
