const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Recipe endpoints", function () {
  let db;

  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];
  const testIngredients = helpers.makeIngredients();
  const testRecipeIngredients = helpers.makeRecipeIngredients();
  const testRecipes = helpers.makeRecipes();

  before("make knex instance", () => {
    db = helpers.makeKnexInstance();
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());
  before("cleanup", () => helpers.cleanTables(db));
  afterEach("cleanup", () => helpers.cleanTables(db));

  describe("GET /api/recipes", () => {
    const userRecipes = 
    [
      {
        title: "Test Recipe 1",
        recipe_ingredients: ["Test Ingredient 1", "Test Ingredient 2"],
        recipe_instructions: ["instruction 1.1", "instruction 1.2"],
        time_to_make: 21,
        recipe_owner: 1,
      },
      {
        title: "Test Recipe 2",
        recipe_ingredients: ["Test Ingredient 3", "Test Ingredient 4"],
        recipe_instructions: ["instruction 2.1", "instruction 2.2"],
        time_to_make: 22,
        recipe_owner: 1,
      }
    ];
    
    beforeEach("insert users, ingredients", () => {
      return helpers.seedRecipes(
        db,
        testUsers,
        testRecipes,
        testIngredients,
        testRecipeIngredients
      );
    });

    it("responds with 200 and user's recipes", () => {
      return supertest(app)
        .get("/api/recipes")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .expect(200)
        .expect(userRecipes);
    });
  });
    
  describe("POST /api/recipes", () => {

    beforeEach("insert users, recipes", () => {
      return helpers.seedRecipes(
        db,
        testUsers,
        testRecipes,
        testIngredients,
        testRecipeIngredients
      );
    });

    it("responds with 201 and creates a recipe", () => {
      const newRecipe = {
        title: "Test Recipe 5",
        recipe_ingredients: ["test ingredient 1", "test ingredient 2"],
        recipe_instructions: ["instruction 5.1", "instruction 5.2"],
        time_to_make: 25,
        recipe_owner: 1,
      };
      return supertest(app)
        .post("api/recipes")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newRecipe)
        .expect(201)
        .expect(res => {
          console.log("res.body in test is", res.body);
          expect(res.body).to.have.property("id");
          expect(res.body.title).to.eql(newRecipe.title);
          expect(res.body.recipe_ingredients).to.eql(newRecipe.recipe_ingredients);
          expect(res.body.recipe_instructions).to.eql(newRecipe.recipe_instructions);
          expect(res.body.time_to_make).to.eql(newRecipe.time_to_make);
          expect(res.body.recipe_owner).to.eql(newRecipe.recipe_owner);
        })
        .expect(res =>
          db
            .from("recipes")
            .select("*")
            .where({ id: res.body.id})
            .first()
            .then(row => {
              expect(row.title).to.eql(newRecipe.title);
              expect(row.recipe_ingredients).to.eql(newRecipe.recipe_ingredients);
              expect(row.recipe_instructions).to.eql(newRecipe.recipe_instructions);
              expect(row.time_to_make).to.eql(newRecipe.time_to_make);
              expect(row.recipe_owner).to.eql(newRecipe.recipe_owner);
            })
        );
    });
  });
  
  describe("PATCH /api/recipes", () => {

    beforeEach("insert users, recipes", () => {
      return helpers.seedRecipes(
        db,
        testUsers,
        testRecipes,
        testIngredients,
        testRecipeIngredients
      );
    });

    const updatedRecipe =
    {
      id: 1,
      title: "Test Recipe 1 edited",
      recipe_ingredients: ["test ingredient 1", "test ingredient 2"],
      recipe_instructions: ["instruction 1.1", "instruction 1.2", "instruction 1.3"],
      time_to_make: 30,
      recipe_owner: 1,
    };

    it("responds with 201 and updates a recipe", () => {
      return supertest(app)
        .post("api/recipes/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(updatedRecipe)
        .expect(201)
        .expect(res => {
          console.log("res.body in test is", res.body);
          expect(res.body).to.have.property("id");
          expect(res.body.title).to.eql(newRecipe.title);
          expect(res.body.recipe_ingredients).to.eql(updatedRecipe.recipe_ingredients);
          expect(res.body.recipe_instructions).to.eql(updatedRecipe.recipe_instructions);
          expect(res.body.time_to_make).to.eql(updatedRecipe.time_to_make);
          expect(res.body.recipe_owner).to.eql(updatedRecipe.recipe_owner);
        })
        .expect(res =>
          db
            .from("recipes")
            .select("*")
            .where({ id: res.body.id})
            .first()
            .then(row => {
              expect(row.title).to.eql(updatedRecipe.title);
              expect(row.recipe_ingredients).to.eql(updatedRecipe.recipe_ingredients);
              expect(row.recipe_instructions).to.eql(updatedRecipe.recipe_instructions);
              expect(row.time_to_make).to.eql(updatedRecipe.time_to_make);
              expect(row.recipe_owner).to.eql(updatedRecipe.recipe_owner);
            })
        );
    })
  });

  describe("DELETE /api/recipes", () => {
    beforeEach("insert users, recipes", () => {
      return helpers.seedRecipes(
        db,
        testUsers,
        testRecipes,
        testIngredients,
        testRecipeIngredients
      );
    });

    const recipeToDelete = {
      title: "Test Recipe 1",
      recipe_ingredients: ["Test Ingredient 1", "Test Ingredient 2"],
      recipe_instructions: ["instruction 1.1", "instruction 1.2"],
      time_to_make: 21,
      recipe_owner: 1,
    };

    it("responds with 204 and deletes a recipe", () => {
      return supertest(app)
        .delete("/api/pantry/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(recipeToDelete)
        .expect(204);  
          
    });
  });
});