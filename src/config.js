module.exports = {
  PORT: process.env.PORT || 8000,
  NODE_ENV: process.env.NODE_ENV || "test",
  DATABASE_URL:
    process.env.DATABASE_URL ||
    "postgresql://dunder_mifflin:mypassword@localhost/kitchen_helper_2020",
  TEST_DATABASE_URL:
    process.env.TEST_DATABASE_URL ||
    "postgresql://dunder_mifflin:mypassword@localhost/kitchen_helper_test_2020",
  JWT_SECRET: process.env.JWT_SECRET || "change-this-secret"
};
