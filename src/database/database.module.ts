import { Inject, Module, OnApplicationShutdown } from "@nestjs/common";
import { Sequelize } from "sequelize";
import { SEQUELIZE } from "./database.constants.js";
import { databaseProviders } from "./database.providers.js";

/**
 * Owns the connection to MySQL. Feature modules import this module and inject
 * the Sequelize instance with `@Inject(SEQUELIZE)` to register their models.
 */
@Module({
    providers: [...databaseProviders],
    exports: [...databaseProviders],
})
export class DatabaseModule implements OnApplicationShutdown {
    constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

    async onApplicationShutdown(): Promise<void> {
        await this.sequelize.close();
    }
}
