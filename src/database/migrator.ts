import { QueryInterface, Sequelize } from "sequelize";
import { SequelizeStorage, Umzug, UmzugOptions } from "umzug";
import * as createProducts from "./migrations/20261116000000-create-products.js";

/**
 * Every migration, in the order it must run. Listed explicitly rather than
 * found with a glob so the same list works from `src` (via tsx) and from the
 * compiled `dist`, where a glob would also match the emitted `.d.ts` files.
 * Add new migrations to the end.
 */
const migrations = [
    { name: "20261116000000-create-products", ...createProducts },
];

/**
 * Creates the migration runner for the given database. Applied migrations are
 * recorded in the `SequelizeMeta` table, the same table sequelize-cli uses.
 */
export const createMigrator = (
    sequelize: Sequelize,
    logger: UmzugOptions["logger"] = console,
): Umzug<QueryInterface> =>
    new Umzug({
        migrations,
        context: sequelize.getQueryInterface(),
        storage: new SequelizeStorage({ sequelize }),
        logger,
    });
