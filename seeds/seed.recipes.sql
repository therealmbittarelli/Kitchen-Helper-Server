BEGIN;

TRUNCATE
  recipe_ingredients,
  ingredients,
  mealplans,
  recipes,
  accounts
  RESTART IDENTITY CASCADE;


INSERT INTO accounts (first_name, user_name, password)
VALUES
  ('Calvin', 'thunderer', '$2a$12$Tv6tC.J6HJMlMEQ6TMEg2OfgHD2cYXNjyLq0YWMfmnCNvpDEXrSLq'),
  ('Mandee', 'Lightning', '$2a$12$6.ZuE93xhiwj7wEIdF/HKOWA3GMZq1ehtzTQz0hYrEQdjUDyK3HJu');


INSERT INTO recipes (title, recipe_description, time_to_make, recipe_owner)
VALUES
  ('Stew', 'makes meat and potato stew for 4', '24:30', 1),
  ('Bread', 'makes a loaf of tasty homemade bread', '35:00', 2),
  ('Meat-Pie', 'makes a meat filled pie with upper and low crust, feeds 6', '25:00', 1);
  
INSERT INTO ingredients (ingredient_name, in_stock, notes, ingredient_owner)
VALUES
  ('chicken thighs', 'in-stock', 'with skin', 1),
  ('black beans', 'in-stock', 'canned', 2),
  ('dried basil', 'low', null, 2),
  ('peanut butter', 'in-stock', 'smooth', 1),
  ('yeast', 'out-of-stock', null, 1);

INSERT INTO recipe_ingredients (recipe_id, ingredient_id)
VALUES
  (1, 2),
  (1, 4),
  (2, 1),
  (2, 2),
  (3, 1),
  (3, 3);

INSERT INTO mealplans (title, planned_date, time_to_make, needed_ingredients, mealplan_owner)
VALUES
  ('Stew Dinner', '2/12/2020', '24:30', 'stew-meat, beef stock (2), salt, potatoes, carrots', 2);


COMMIT;
