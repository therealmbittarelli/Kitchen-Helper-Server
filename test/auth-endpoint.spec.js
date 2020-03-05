const jwt = require("jsonwebtoken");
const app = require("../src/app");
const helpers = require("./test-helpers");

describe("Auth Endpoints V1", function () {
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

  /**
   * @description Get token for login
   **/
  describe("POST /api/auth/token", () => {

    const requiredFields = ["user_name", "password"];

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password,
      };

      it(`responds with 400 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field];
        return supertest(app)
          .post("/api/auth/login")
          .send(loginAttemptBody)
          .expect(400, {
            error: `Missing ${field} in request body`,
          });
      });
    });

    it("responds 400 'invalid user_name or password' when bad user_name", () => {
      const userInvalidUser = { user_name: "user-not", password: "existy" };
      return supertest(app)
        .post("/api/auth/login")
        .send(userInvalidUser)
        .expect(400, { error: "Incorrect user_name or password" });
    });

    it("responds 400 'invalid user_name or password' when bad password", () => {
      const userInvalidPass = { user_name: testUser.user_name, password: "incorrect" };
      return supertest(app)
        .post("/api/auth/login")
        .send(userInvalidPass)
        .expect(400, { error: "Incorrect user_name or password" });
    });

    it("responds 200 and JWT auth token using secret when valid credentials", () => {

      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password,
      };
      const expectedToken = jwt.sign(
        { user_id: testUser.id, name: testUser.name },
        process.env.JWT_SECRET,
        {
          subject: testUser.user_name,
          expiresIn: process.env.JWT_EXPIRY,
          algorithm: "HS256",
        }
      );
      supertest(app)
        .post("/api/accounts")
        .send({
          user_name: testUser.user_name,
          first_name: testUser.first_name,
          password: testUser.password,
        })
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .expect(201)
        .end = (error, res) => {
          return supertest(app)
            .post("/api/auth/login")
            .send(userValidCreds)
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .expect(200, {
              authToken: expectedToken,
            });
        };
    });
    it("responds 400 invalid username and password", () => {

      const userValidCreds = {
        user_name: testUser.user_name,
        password: testUser.password,
      };
      supertest(app)
        .post("/api/accounts")
        .send({
          user_name: 3,
          first_name: testUser.first_name,
          password: "hello",
        })
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .end(function (err, res) {
          return supertest(app)
            .post("/api/auth/login")
            .send(userValidCreds)
            .set("Content-Type", "application/json")
            .set("Accept", "application/json")
            .end(function (err, res) {
              res.body.should.have.property("error");
              expect(400, { error: "Incorrect user_name or password" });
            });
        });
    });
  });

  /**
   * @description Refresh token
   **/
  describe("PUT /api/auth/token", () => {
    beforeEach("insert users", () =>
      helpers.seedUsers(
        db,
        testUsers,
      )
    );

    it("responds 200 and JWT auth token using secret", () => {
      const subject = testUser.user_name;
      const payload = {
        user_id: testUser.id,
        name: testUser.first_name,
      };
      const expectedToken = jwt.sign(payload, process.env.JWT_SECRET, {
        subject,
        algorithm: "HS256"
      });
      return supertest(app)
        .put("/api/auth/token")
        .set("Authorization", helpers.makeAuthHeader(testUser))
        .set("Content-Type", "application/json")
        .set("Accept", "application/json")
        .expect(200, {
          authToken: expectedToken,
        });
    });
  });
});
