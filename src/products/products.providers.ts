import { Provider } from "@nestjs/common";
import { Sequelize } from "sequelize";
import { SEQUELIZE } from "../database/database.constants.js";
import { defineProductModel, ProductRepository } from "./product.model.js";
import { PRODUCTS_REPOSITORY } from "./products.constants.js";

export const productsProviders: Provider[] = [
    {
        provide: PRODUCTS_REPOSITORY,
        useFactory: (sequelize: Sequelize): ProductRepository =>
            defineProductModel(sequelize),
        inject: [SEQUELIZE],
    },
];
