import { Injectable } from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product-dto.js";
import { UpdateProductDto } from "./dto/update-product-dto.js";

@Injectable()
export class AppService {
    findAll(): string {
        return "I will find all products!";
    }

    create(createProductBody: CreateProductDto): string {
        return `I will create a product! It will have this configuration: ${JSON.stringify(createProductBody)}`;
    }

    findOne(id: number): string {
        return `I will find the product ${id}!`;
    }

    update(id: number, updateProductBody: UpdateProductDto): string {
        return `I will update the product ${id}! It will have this configuration: ${JSON.stringify(updateProductBody)}`;
    }

    delete(id: number): string {
        return `I will delete the product ${id}!`;
    }
}
