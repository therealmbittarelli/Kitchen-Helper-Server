const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Recipe endpoints", function () {
  let db;

  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];
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
          id: 1,
          title: "Test Recipe 1",
          recipe_description: "{\"instruction 1.1\",\"instruction 1.2\"}",
          time_to_make: "21",
          recipe_owner: 1,
        },
        {
          id: 2,
          title: "Test Recipe 2",
          recipe_description: "{\"instruction 2.1\",\"instruction 2.2\"}",
          time_to_make: "22",
          recipe_owner: 1,
        }
      ];


    beforeEach("insert users, ingredients", () => {
      return helpers.seedRecipes(
        db,
        testUsers,
        testRecipes,

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

      );
    });

    it("responds with 201 and creates a recipe", () => {
      const newRecipe = {
        title: "Test Recipe 5",
        //recipe_ingredients: ["test ingredient 1", "test ingredient 2"],
        recipe_description: '{"instruction 5.1", "instruction 5.2"}',
        time_to_make: 25,
        recipe_owner: 1,
      };

      return supertest(app)
        .post("/api/recipes")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newRecipe)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property("id");
          expect(res.body.title).to.eql(newRecipe.title);
          expect(res.body.recipe_description).to.eql(newRecipe.recipe_description);
          expect(res.body.time_to_make).to.eql(JSON.stringify(newRecipe.time_to_make));
          expect(res.body.recipe_owner).to.eql(newRecipe.recipe_owner);
        })
        .expect(res =>
          db
            .from("recipes")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.title).to.eql(newRecipe.title);
              expect(row.recipe_description).to.eql(newRecipe.recipe_description);
              expect(row.time_to_make).to.eql(JSON.stringify(newRecipe.time_to_make));
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
      );
    });

    const updatedRecipe =
    {
      id: 1,
      title: "Test Recipe 1 edited",
      recipe_ingredients: ["test ingredient 1", "test ingredient 2"],
      recipe_description: ["instruction 1.1", "instruction 1.2", "instruction 1.3"],
      time_to_make: 30,
      recipe_owner: 1,
    };

    it("responds with 201 and updates a recipe", () => {
      return supertest(app)
        .patch("/api/recipes/:1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(updatedRecipe)
        .expect(201)
        .expect({});
    });
  });

  describe("DELETE /api/recipes", () => {
    beforeEach("insert users, recipes", () => {
      return helpers.seedRecipes(
        db,
        testUsers,
        testRecipes,
      );
    });

    const recipeToDelete = {
      id: 1,
      title: "Test Recipe 1",
      recipe_ingredients: ["Test Ingredient 1", "Test Ingredient 2"],
      recipe_description: ["instruction 1.1", "instruction 1.2"],
      time_to_make: 21,
      recipe_owner: 1,
    };

    it("responds with 204 and deletes a recipe", () => {
      return supertest(app)
        .delete("/api/recipes/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(recipeToDelete)
        .expect(204);

    });
  });
});