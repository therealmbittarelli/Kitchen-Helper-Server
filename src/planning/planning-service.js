const planningService = {
  getMealPlans(db, user_id) {
    return db("mealplans")
      .select("*")
      .where("mealplan_owner", user_id);
  },
  addMealPlan(db, mealplan) {
    return db
      .insert(mealplan)
      .into("mealplans")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },
  updateMealPlan(db, updatedMealPlan, mealPlanId) {
    return db("mealplans")
      .where({ id: mealPlanId })
      .update(updatedMealPlan)
      .returning("*");
  },
  deleteMealPlan(db, id) {
    return db("mealplans")
      .where({ id })
      .delete();
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
  getMealPlanRecipeData(db, recipe_id) {
    return db
      .from("recipe_ingredients")
      .where("recipe_id", recipe_id)
      .join("ingredient_id", {
        "ingredients.id": "recipe_ingredients.ingredient_id"
      })
      .select("ingredients.ingredient_name");
  },
  isValidTitleInput(title) {
    if (title === "") {
      return false;
    }
    return true;
  },
  isValidIngredientsInput(ingredients) {

    if (ingredients === "") {
      return false;
    }

    return true;
  }
};

module.exports = planningService;
