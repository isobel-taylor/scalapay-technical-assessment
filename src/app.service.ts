import { HttpException, Injectable } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product-dto.js";
import { UpdateProductBodyDto } from "./dto/update-product-dto.js";
import { Product } from "./db/index.js";
import { ProductType } from "./db/types.js";

@Injectable()
export class AppService {
    async findAll(page: number, pageSize: number): Promise<ProductType[]> {
        return await Product.findAll({
            order: [["id", "asc"]],
            limit: pageSize,
            offset: (page - 1) * pageSize,
        });
    }

    async create(createProductBody: CreateProductDto): Promise<number> {
        const newProduct = await Product.create(createProductBody);
        return newProduct.dataValues.id;
    }

    async findOne(id: number): Promise<ProductType> {
        const product = await Product.findByPk(id);

        if (product === null) {
            throw new HttpException("Product not found", 404);
        }

        return product;
    }

    async update(
        id: number,
        updateProductBody: UpdateProductBodyDto,
    ): Promise<void> {
        const affectedRows = (
            await Product.update(updateProductBody, {
                where: {
                    id,
                },
            })
        )[0];

        // For an update, if the number of rows affected is 0, that may mean
        // that the row exists, but didn't change. Do a lookup after the fact
        // to differentiate, so most updates will involve only one query.
        if (affectedRows === 0) {
            if ((await Product.findByPk(id)) === null) {
                throw new HttpException("Product not found", 404);
            }
        }
    }

    async delete(id: number): Promise<void> {
        const affectedRows = await Product.destroy({
            where: {
                id,
            },
        });

        if (affectedRows === 0) {
            throw new HttpException("Product not found", 404);
        }
    }
}
