import { HttpException, Inject, Injectable } from "@nestjs/common";
import { UniqueConstraintError } from "sequelize";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { UpdateProductBodyDto } from "./dto/update-product.dto.js";
import { PRICE_SCALE } from "./product.model.js";
import type { Product, ProductRepository } from "./product.model.js";
import { PRODUCTS_REPOSITORY } from "./products.constants.js";

/**
 * Prices arrive as numbers but are stored in a DECIMAL column, which Sequelize
 * reads and writes as strings. Converting here keeps the exact value.
 */
const toDecimalString = (price: number): string => price.toFixed(PRICE_SCALE);

@Injectable()
export class ProductsService {
    constructor(
        @Inject(PRODUCTS_REPOSITORY)
        private readonly products: ProductRepository,
    ) {}

    async findAll(page: number, pageSize: number): Promise<Product[]> {
        return await this.products.findAll({
            order: [["id", "asc"]],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
    }

    async create(createProductBody: CreateProductDto): Promise<number> {
        const { price, ...rest } = createProductBody;
        try {
            const newProduct = await this.products.create({
                ...rest,
                price: toDecimalString(price),
            });
            return newProduct.dataValues.id;
        } catch (error) {
            // productToken is the only unique column a client supplies, so a
            // unique violation means the token is already in use.
            if (error instanceof UniqueConstraintError) {
                throw new HttpException(
                    "A product with this productToken already exists",
                    409,
                );
            }
            throw error;
        }
    }

    async findOne(id: number): Promise<Product> {
        const product = await this.products.findByPk(id);

        if (product === null) {
            throw new HttpException("Product not found", 404);
        }

        return product;
    }

    async update(
        id: number,
        updateProductBody: UpdateProductBodyDto,
    ): Promise<void> {
        const { price, ...rest } = updateProductBody;
        const values =
            price === undefined
                ? rest
                : { ...rest, price: toDecimalString(price) };

        const affectedRows = (
            await this.products.update(values, {
                where: {
                    id,
                },
            })
        )[0];

        // For an update, if the number of rows affected is 0, that may mean
        // that the row exists, but didn't change. Do a lookup after the fact
        // to differentiate, so most updates will involve only one query.
        if (affectedRows === 0) {
            if ((await this.products.findByPk(id)) === null) {
                throw new HttpException("Product not found", 404);
            }
        }
    }

    async delete(id: number): Promise<void> {
        const affectedRows = await this.products.destroy({
            where: {
                id,
            },
        });

        if (affectedRows === 0) {
            throw new HttpException("Product not found", 404);
        }
    }
}
