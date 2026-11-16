import { DataTypes, Model, Sequelize } from "sequelize";
import {
    PRICE_PRECISION,
    PRICE_SCALE,
    ProductAttributes,
    ProductCreationAttributes,
} from "./types.js";

export const sequelize = new Sequelize({
    dialect: "mysql",
    host: "127.0.0.1",
    port: 3306,
    database: process.env.MYSQL_DATABASE,
    username: "root",
    password: process.env.MYSQL_ROOT_PASSWORD,
});

export const Product = sequelize.define<
    Model<ProductAttributes, ProductCreationAttributes>
>(
    "Product",
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },
        productToken: {
            type: DataTypes.UUID,
            unique: true,
            defaultValue: DataTypes.UUIDV4,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        price: {
            type: DataTypes.DECIMAL(PRICE_PRECISION, PRICE_SCALE),
            allowNull: false,
            validate: {
                min: 0,
            },
        },
        stock: {
            type: DataTypes.BIGINT,
            defaultValue: 0,
            validate: {
                min: 0,
            },
        },
    },
    {
        tableName: "products",
    },
);

// // Force reset the DB on start. Highly discouraged in production.
// (async () => {
//     await sequelize.sync({ force: true });
// })();
