const planningService = {
  getMealPlans(db, user_id) {
    console.log("getting mealplans");
    return db("mealplans")
      .select("*")
      .where("mealplan_owner", user_id);
  },
  addMealPlan(db, mealplan) {
    console.log("addMealPlan activated");
    return db
      .insert(mealplan)
      .into("mealplans")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  getAllByUser(db, accounts) {
    return db("mealplans")
      .select("*")
      .where("mealplan_owner", accounts);
  },
  getMealPlanById(db, id) {
    return db("mealplans")
      .select("*")
      .where("mealplans.id", id)
      .first();
  },
  getMealPlanOwnerData(db, mealplan_owner) {
    return db("users")
      .where("mealplan_owner", mealplan_owner)
      .first();
  },
  deleteMealPlan(db, id) {
    return db("mealplans")
      .where({ id })
      .delete();
  },
  updateMealPlan(db, updatedMealPlan, mealPlanId) {
    return db("mealplans")
      .where({ id: mealPlanId })
      .update(updatedMealPlan)
      .returning("*");
  }
};

module.exports = planningService;
