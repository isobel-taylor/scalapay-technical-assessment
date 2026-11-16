import { Sequelize } from "sequelize";
import { createSequelize } from "./../src/database/database.providers.js";
import { createMigrator } from "./../src/database/migrator.js";

// Runs the migrations against the real e2e database (see
// vitest.config.e2e.ts), starting from an empty schema each time.
describe("Migrations (e2e)", () => {
    let sequelize: Sequelize;

    const migrator = () => createMigrator(sequelize, undefined);
    const tables = async () =>
        (await sequelize.getQueryInterface().showAllTables()).sort();

    beforeAll(() => {
        sequelize = createSequelize({ logging: false });
        if (!sequelize.getDatabaseName().endsWith("_test")) {
            throw new Error("e2e tests must run against a *_test database");
        }
    });

    beforeEach(async () => {
        await sequelize.getQueryInterface().dropAllTables();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it("applies every migration to an empty database", async () => {
        await migrator().up();

        expect(await migrator().pending()).toEqual([]);
        expect(await tables()).toEqual(["SequelizeMeta", "products"]);
    });

    it("creates the products table with the expected columns", async () => {
        await migrator().up();

        const columns = await sequelize
            .getQueryInterface()
            .describeTable("products");

        expect(columns).toMatchObject({
            id: { type: "BIGINT", allowNull: false, primaryKey: true },
            productToken: { type: "VARCHAR(255)", allowNull: false },
            name: { type: "VARCHAR(255)", allowNull: false },
            price: { type: "DECIMAL(10,2)", allowNull: false },
            stock: { type: "BIGINT", allowNull: false, defaultValue: "0" },
            createdAt: { type: "DATETIME", allowNull: false },
            updatedAt: { type: "DATETIME", allowNull: false },
        });
    });

    it("is a no-op when run again", async () => {
        await migrator().up();

        await expect(migrator().up()).resolves.toEqual([]);
    });

    it("can be fully reverted and re-applied", async () => {
        await migrator().up();

        await migrator().down({ to: 0 });
        expect(await tables()).toEqual(["SequelizeMeta"]);
        expect(await migrator().executed()).toEqual([]);

        await migrator().up();
        expect(await tables()).toEqual(["SequelizeMeta", "products"]);
    });
});
