import "dotenv/config";

import { createSequelize } from "./database.providers.js";
import { createMigrator } from "./migrator.js";

/**
 * Command-line entry point for migrations, using Umzug's built-in commands:
 * `up`, `down`, `pending` and `executed` (run with `--help` for options).
 * Connects with the same settings as the app.
 */
const sequelize = createSequelize({ logging: false });
try {
    await createMigrator(sequelize).runAsCLI();
} finally {
    await sequelize.close();
}
