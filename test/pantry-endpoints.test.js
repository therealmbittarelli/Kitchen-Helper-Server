const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Pantry endpoints", function () {
  let db;

  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];

  const testIngredients = helpers.makeIngredients();

  before("make knex instance", () => {
    db = helpers.makeKnexInstance();
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());
  before("cleanup", () => helpers.cleanTables(db));
  afterEach("cleanup", () => helpers.cleanTables(db));



  describe("GET /api/pantry", () => {

    const userIngredients =
      [
        {
          id: 1,
          ingredient_name: "Test Ingredient 1",
          in_stock: "in-stock",
          notes: "Test notes 1",
          ingredient_owner: 1
        },
        {
          id: 2,
          ingredient_name: "Test Ingredient 2",
          in_stock: "in-stock",
          notes: "Test notes 2",
          ingredient_owner: 1
        },
      ];

    beforeEach("insert users, ingredients", () => {
      return helpers.seedPantry(
        db,
        testUsers,
        testIngredients
      );
    });

    it("responds with 200 and user's ingredients", () => {
      return supertest(app)
        .get("/api/pantry")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .expect(200)
        .expect(userIngredients);
    });
  });

  describe("POST /api/pantry", () => {

    beforeEach("insert users, ingredients", () => {
      return helpers.seedPantry(
        db,
        testUsers,
        testIngredients
      );
    });

    it("responds with 201 and creates an ingredient", () => {
      const newIngredient =
      {
        ingredient_name: "Test Ingredient 5",
        in_stock: "in-stock",
        notes: "Test notes 5",
        ingredient_owner: 1
      };
      return supertest(app)
        .post("/api/pantry")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(newIngredient)
        .expect(201)
        .expect(res => {
          expect(res.body).to.have.property("id");
          expect(res.body.ingredient_name).to.eql(newIngredient.ingredient_name.toLowerCase());
          expect(res.body.in_stock).to.eql(newIngredient.in_stock);
          expect(res.body.notes).to.eql(newIngredient.notes);
          expect(res.body.ingredient_owner).to.eql(newIngredient.ingredient_owner);
        })
        .expect(res =>
          db
            .from("ingredients")
            .select("*")
            .where({ id: res.body.id })
            .first()
            .then(row => {
              expect(row.ingredient_name).to.eql(newIngredient.ingredient_name.toLowerCase());
              expect(row.in_stock).to.eql(newIngredient.in_stock);
              expect(row.notes).to.eql(newIngredient.notes);
              expect(row.ingredient_owner).to.eql(newIngredient.ingredient_owner);
            })
        );
    });

  });

  describe("PATCH /api/pantry/:ingredient_id", () => {

    beforeEach("insert users, ingredients", () => {
      return helpers.seedPantry(
        db,
        testUsers,
        testIngredients
      );
    });

    const updatedIngredient =
    {
      id: 1,
      ingredient_name: "test ingredient 1",
      in_stock: "low",
      notes: "Test notes 1 updated",
      ingredient_owner: 1
    };

    it("responds with 201 and updates an ingredient", () => {
      return supertest(app)
        .patch("/api/pantry/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(updatedIngredient)
        .expect(201)
        .expect(res => {
          expect(res.body[0]).to.have.property("id");
          expect(res.body[0].ingredient_name).to.eql(updatedIngredient.ingredient_name.toLowerCase());
          expect(res.body[0].in_stock).to.eql(updatedIngredient.in_stock);
          expect(res.body[0].notes).to.eql(updatedIngredient.notes);
          expect(res.body[0].ingredient_owner).to.eql(updatedIngredient.ingredient_owner);
        })
        .expect(res => {
          db
            .from("ingredients")
            .select("*")
            .where({ id: res.body[0].id })
            .first()
            .then(row => {
              expect(row.ingredient_name).to.eql(updatedIngredient.ingredient_name.toLowerCase());
              expect(row.in_stock).to.eql(updatedIngredient.in_stock);
              expect(row.notes).to.eql(updatedIngredient.notes);
              expect(row.ingredient_owner).to.eql(updatedIngredient.ingredient_owner);
            });
        });
    });
  });

  describe("DELETE /api/pantry/:ingredient_id", () => {
    beforeEach("insert users, ingredients", () => {
      return helpers.seedPantry(
        db,
        testUsers,
        testIngredients
      );
    });

    const ingredientToDelete =
    {
      id: 1,
      ingredient_name: "Test Ingredient 1",
      in_stock: "in-stock",
      notes: "Test notes 1",
      ingredient_owner: 1
    };

    it("responds with 204 and deletes an ingredient", () => {
      return supertest(app)
        .delete("/api/pantry/1")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .send(ingredientToDelete)
        .expect(204);

    });
  });
});
