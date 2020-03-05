const knex = require("knex");
const app = require("../src/app");
const helpers = require("./test-helpers");

const userMealPlans =
    [
        {
            id: 2,
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

const updatedMealPlan =
{
    id: 5,
    title: "breaded",
    owner: 1,
    planned_date: "2/14/2022",
    time_to_make: '30',
    needed_ingredients: "potatoes",
    mealplan_owner: 1
};



describe("Mealplan endpoints", function () {
    let db;

    const testUsers = helpers.makeUsersArray();
    const testUser = testUsers[0];

    const testPlans = helpers.makeMealPlans()
    const testPlan = testPlans


    before("make knex instance", () => {
        db = helpers.makeKnexInstance();
        app.set("db", db);
    });

    after("disconnect from db", () => db.destroy());
    before("cleanup", () => helpers.cleanTables(db));
    afterEach("cleanup", () => helpers.cleanTables(db));



    describe("GET /api/planner", () => {

        // const usersIngredients = userMealPlans.filter(
        //   ingredient => ingredient.id === userMealPlans.id
        // );


        beforeEach("insert users, mealplans", () => {
            return helpers.seedMealPlans(
                db,
                testUsers,
                userMealPlans
            );
        }); // end of beforeeach

        it("responds with 200 and user's mealplans", () => {
            return supertest(app)
                .get("/api/planner")
                .set("Authorization", helpers.makeAuthHeader(testUser))
                .expect(200)
                .expect(userMealPlans);
        });
    }); // end of describe

    describe("POST /api/planner", () => {

        beforeEach("insert users, mealplans", () => {
            return helpers.seedMealPlans(
                db,
                testUsers,
                userMealPlans
            );
        }); // end of beforeeach

        it("responds with 201 and creates a mealplan", () => {
            const newMealPlan =
            {
                id: 5,
                title: "breaded",
                planned_date: "2/14/2020",
                time_to_make: '30',
                needed_ingredients: "potatoes",
                mealplan_owner: 1
            };
            return supertest(app)
                .post("/api/planner")
                .set("Authorization", helpers.makeAuthHeader(testUser))
                .send(newMealPlan)
                .expect(201)
                .expect(res => {
                    expect(res.body).to.have.property("id");
                    expect(res.body.title).to.eql(newMealPlan.title.toLowerCase());
                    expect(res.body.planned_date).to.eql(newMealPlan.planned_date);
                    expect(res.body.time_to_make).to.eql(newMealPlan.time_to_make);
                    expect(res.body.needed_ingredients).to.eql(newMealPlan.needed_ingredients);
                    expect(res.body.mealplan_owner).to.eql(newMealPlan.mealplan_owner);
                })
                .expect(res =>
                    db
                        .from("mealplans")
                        .select("*")
                        .where({ id: res.body.id })
                        .first()
                        .then(row => {
                            expect(res.body.title).to.eql(newMealPlan.title.toLowerCase());
                            expect(res.body.planned_date).to.eql(newMealPlan.planned_date);
                            expect(res.body.time_to_make).to.eql(newMealPlan.time_to_make);
                            expect(res.body.needed_ingredients).to.eql(newMealPlan.needed_ingredients);
                            expect(res.body.mealplan_owner).to.eql(newMealPlan.mealplan_owner);
                        })
                );
        });

    });// end of describe

    describe("PATCH /api/planner/:mealplan_owner", () => {

        beforeEach("insert users, mealplans", () => {
            return helpers.seedMealPlans(
                db,
                testUsers,
                userMealPlans
            );
        }); // end of beforeeach



        it("responds with 201 and updates a mealplan", () => {
            return supertest(app)
                .patch("/api/planner/:mealplan_owner")
                .set("Authorization", helpers.makeAuthHeader(testUser))
                .send(updatedMealPlan)
                .expect(201)
                .expect({})
        });
    });// end of describe

    describe("DELETE /api/planner/:mealplan_owner", () => {
        beforeEach("insert users, mealplans", () => {
            return helpers.seedMealPlans(
                db,
                testUsers,
                userMealPlans
            );
        }); // end of beforeeach

        const mealplanToDelete =
        {
            id: 2,
            title: "bread",
            planned_date: "2/14/2020",
            time_to_make: "30",
            needed_ingredients: "potatoes",
            mealplan_owner: 1
        };

        it("responds with 204 and deletes a mealplan", () => {
            return supertest(app)
                .delete("/api/planner/1")
                .set("Authorization", helpers.makeAuthHeader(testUser))
                .send(mealplanToDelete)
                .expect(204);

        });
    });
});// end of describe