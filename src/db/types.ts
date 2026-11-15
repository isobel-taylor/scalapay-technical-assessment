import { Model } from "sequelize";

export interface ProductAttributes {
    id: number;
    productToken: string;
    name: string;
    price: number;
    stock: number;
}

export type ProductCreationAttributes = Pick<
    ProductAttributes,
    "name" | "price"
> &
    Partial<Pick<ProductAttributes, "stock">>;

export type ProductType = Model<ProductAttributes, ProductCreationAttributes>;
