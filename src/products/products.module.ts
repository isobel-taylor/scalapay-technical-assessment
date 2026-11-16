import { Module } from "@nestjs/common";
import { DatabaseModule } from "../database/database.module.js";
import { ProductsController } from "./products.controller.js";
import { productsProviders } from "./products.providers.js";
import { ProductsService } from "./products.service.js";

@Module({
    imports: [DatabaseModule],
    controllers: [ProductsController],
    providers: [ProductsService, ...productsProviders],
    // Exported so tests (and any future module) can reach the model through
    // dependency injection rather than a module-level import.
    exports: [...productsProviders],
})
export class ProductsModule {}
