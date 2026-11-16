import { Injectable } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product-dto.js";
import { UpdateProductDto } from "./dto/update-product-dto.js";
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

    async findOne(id: number): Promise<ProductType | null> {
        return await Product.findByPk(id);
    }

    async update(
        id: number,
        updateProductBody: UpdateProductDto,
    ): Promise<void> {
        await Product.update(updateProductBody, {
            where: {
                id,
            },
        });
    }

    async delete(id: number): Promise<void> {
        await Product.destroy({
            where: {
                id,
            },
        });
    }
}
