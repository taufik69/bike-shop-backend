require("module-alias/register");
const { connectDatabase } = require("@/shared/config/db.config");
const { env } = require("@/shared/config/env.config");
const { app } = require("@/app");

connectDatabase()
  .then(() => {
    app.listen(env.PORT || 4000, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    });
    console.log("Server started on port 3000");
  })
  .then(() => {
    require("@/shared/workers/example");
  })
  .catch((error) => {
    console.log(error);
    console.error("Failed to connect to the database in index.js:", error);
  });
