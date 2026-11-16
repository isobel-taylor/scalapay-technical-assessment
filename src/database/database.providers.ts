import { Provider } from "@nestjs/common";
import { Options, Sequelize } from "sequelize";
import { SEQUELIZE } from "./database.constants.js";

/**
 * Builds a Sequelize instance for the MySQL database described by the
 * environment. `overrides` lets callers such as the e2e tests adjust options
 * (for example, turning off query logging) without duplicating the rest.
 */
export const createSequelize = (overrides: Options = {}): Sequelize =>
    new Sequelize({
        dialect: "mysql",
        host: "127.0.0.1",
        port: 3306,
        database: process.env.MYSQL_DATABASE,
        username: "root",
        password: process.env.MYSQL_ROOT_PASSWORD,
        ...overrides,
    });

export const databaseProviders: Provider[] = [
    {
        provide: SEQUELIZE,
        useFactory: async (): Promise<Sequelize> => {
            const sequelize = createSequelize();
            // Fail at startup, rather than on the first request, if the
            // database is unreachable or the credentials are wrong.
            await sequelize.authenticate();
            return sequelize;
        },
    },
];
