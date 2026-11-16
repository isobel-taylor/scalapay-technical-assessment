import { DataTypes, Model, ModelStatic, Sequelize } from "sequelize";

/** Total digits and digits after the decimal point of the `price` column. */
export const PRICE_PRECISION = 10;
export const PRICE_SCALE = 2;
/** The largest value a DECIMAL(PRICE_PRECISION, PRICE_SCALE) column holds. */
export const PRICE_MAX = 99_999_999.99;
/**
 * The largest stock accepted. The column is a BIGINT, which holds more, but
 * JavaScript numbers lose integer precision above this, so it is the largest
 * value that round-trips exactly through JSON and the MySQL driver.
 */
export const STOCK_MAX = Number.MAX_SAFE_INTEGER;

export interface ProductAttributes {
    id: number;
    productToken: string;
    name: string;
    price: string;
    stock: number;
}

export type ProductCreationAttributes = Pick<
    ProductAttributes,
    "productToken" | "name" | "price"
> &
    Partial<Pick<ProductAttributes, "stock">>;

/** A row of the `products` table. */
export type Product = Model<ProductAttributes, ProductCreationAttributes>;

/** The model class used to query the `products` table. */
export type ProductRepository = ModelStatic<Product>;

/** Registers the Product model on the given Sequelize instance. */
export const defineProductModel = (sequelize: Sequelize): ProductRepository =>
    sequelize.define<Product>(
        "Product",
        {
            id: {
                type: DataTypes.BIGINT,
                primaryKey: true,
                autoIncrement: true,
            },
            productToken: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
                validate: {
                    notEmpty: true,
                },
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
