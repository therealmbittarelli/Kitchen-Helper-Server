const PantryService = {
  getIngredients(db, user_id) {
    return db("ingredients")
      .select("*")
      .where("ingredient_owner", user_id)
      .whereNot("in_stock", null);
  },
  getIngredientsByIds(db, idArr) {
    return db("ingredients")
      .select("ingredient_name")
      .whereIn("id", idArr);
  },
  addIngredient(db, ingredient) {
    return db
      .insert(ingredient)
      .into("ingredients")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },

  checkIfExists(db, ingredient) {
    return db("ingredients")
      .select("*")
      .where("ingredient_name", ingredient.ingredient_name)
      .where("ingredient_owner", ingredient.ingredient_owner);
  },


  addNewIngredientsFromRecipe(db, ingredient, ingredient_owner) {
    return db
      .insert(ingredient)
      .into("ingredients")
      .returning("*")
      .then(rows => {
        return rows[0];
      });
  },

  getIngredientsIds(db, ingredientArr, ingredient_owner) {
    return db("ingredients")
      .select("id")
      .whereIn("ingredient_name", ingredientArr)
      .where({ ingredient_owner });
  },

  updateIngredient(db, updatedIngredient, ingredientId) {
    return db("ingredients")
      .where({ id: ingredientId })
      .update(updatedIngredient)
      .returning("*");
  },
  deleteIngredient(knex, id) {
    return knex("ingredients")
      .where({ id })
      .delete();
  },
  isValidNotesInput(notes) {
    if (notes === "") {
      return false;
    }
    return true;
  },
  isValidIngredientInput(ingredient) {
    ingredient = ingredient.trim();
    if (ingredient === "") {
      return false;
    }
    return true;
  }
};

module.exports = PantryService;
