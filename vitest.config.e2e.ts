import { config as loadEnv } from "dotenv";
import { defineConfig } from "vitest/config";

// Load the same `.env` the app uses, then point the e2e run at a dedicated
// test database so it never touches development data. The test suite drops
// and recreates its tables, so this separation matters.
loadEnv({ quiet: true });
const baseDatabase = process.env.MYSQL_DATABASE ?? "ecommerce";
process.env.MYSQL_DATABASE = baseDatabase.endsWith("_test")
    ? baseDatabase
    : `${baseDatabase}_test`;

export default defineConfig({
    resolve: { tsconfigPaths: true },
    test: {
        globals: true,
        root: "./",
        include: ["**/*.e2e-spec.ts"],
        globalSetup: ["./test/global-setup.ts"],
        // All e2e files share one database, so run them one at a time.
        fileParallelism: false,
    },
});
