const knex = require("knex");
const bcrypt = require("bcryptjs");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Users Endpoint", function () {
  let db;

  const testUsers = helpers.makeUsersArray();
  const testUser = testUsers[0];

  before("make knex instance", () => {
    db = helpers.makeKnexInstance();
    app.set("db", db);
  });

  after("disconnect from db", () => db.destroy());

  before("cleanup", () => helpers.cleanTables(db));

  afterEach("cleanup", () => helpers.cleanTables(db));

  describe("POST /api/accounts", () => {

    context("User Validation", () => {
      beforeEach("insert users", () =>
        helpers.seedUsers(
          db,
          testUsers,
        )
      );

      const requiredFields = ["first_name", "user_name", "password"];

      requiredFields.forEach(field => {
        const registerAttemptBody = {
          user_name: "test user_name",
          first_name: "test first_name",
          password: "test password",
        };

        it(`responds with 400 required error when '${field}' is missing`, () => {
          delete registerAttemptBody[field];

          return supertest(app)
            .post("/api/accounts")
            .send(registerAttemptBody)
            .expect(400, {
              error: `Something went wrong. Please try again.`,
            });
        });
      });

      it("responds 400 'Password must be longer than 8 characters' when empty password", () => {
        const userShortPassword = {
          user_name: "test user_name",
          first_name: "test first_name",
          password: "1234567"
        };
        return supertest(app)
          .post("/api/accounts")
          .send(userShortPassword)
          .expect(400, { error: "Password must be longer than 8 characters" });
      });

      it("responds 400 'Password must be less than 72 characters' when long password", () => {
        const userLongPassword = {
          user_name: "test user_name",
          first_name: "test first_name",
          password: "*".repeat(73),
        };
        return supertest(app)
          .post("/api/accounts")
          .send(userLongPassword)
          .expect(400, { error: "Password must be less than 72 characters" });
      });

      it("responds 400 error when password starts with spaces", () => {
        const userPasswordStartsSpaces = {
          user_name: "test user_name",
          first_name: "test first_name",
          password: " 1Aa!2Bb@"
        };
        return supertest(app)
          .post("/api/accounts")
          .send(userPasswordStartsSpaces)
          .expect(400, { error: "Password must not start or end with empty spaces" });
      });

      it("responds 400 error when password ends with spaces", () => {
        const userPasswordEndsSpaces = {
          user_name: "test user_name",
          first_name: "test first_name",
          password: "1Aa!2Bb@ "
        };
        return supertest(app)
          .post("/api/accounts")
          .send(userPasswordEndsSpaces)
          .expect(400, { error: "Password must not start or end with empty spaces" });
      });

      it("responds 400 'User name already taken' when user_name isn't unique", () => {
        const duplicateUser = {
          user_name: "test-user-1",
          first_name: "test first_name",
          password: "11AAaa!!"
        };
        return supertest(app)
          .post("/api/accounts")
          .send(duplicateUser)
          .expect(400, { error: "Username already taken" });
      });
    });

    context("Happy path", () => {
      it("responds 201, serialized user, storing bcrypted password", () => {
        const newUser = {
          user_name: "test user_name",
          first_name: "test first_name",
          password: "11AAaa!!"
        };
        return supertest(app)
          .post("/api/accounts")
          .send(newUser)
          .expect(201)
          .expect(res => {
            expect(res.body).to.have.property("id");
            expect(res.body.first_name).to.eql(newUser.first_name);
            expect(res.headers.location).to.eql(`/api/accounts/${res.body.id}`);
          })
          .expect(res =>
            db
              .from("accounts")
              .select("*")
              .where({ id: res.body.id })
              .first()
              .then(row => {
                expect(row.first_name).to.eql(newUser.first_name);
                return bcrypt.compare(newUser.password, row.password);
              })
              .then(compareMatch => {
                expect(compareMatch).to.be.true;
              })
          );
      });
    });
  });
});