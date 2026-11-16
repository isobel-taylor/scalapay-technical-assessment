import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { CreateProductDto } from "./dto/create-product.dto.js";
import { DeleteProductDto } from "./dto/delete-product.dto.js";
import { FindAllProductsDto } from "./dto/find-all-products.dto.js";
import { FindOneProductDto } from "./dto/find-one-product.dto.js";
import {
    UpdateProductBodyDto,
    UpdateProductParamDto,
} from "./dto/update-product.dto.js";
import { Product } from "./product.model.js";
import { ProductsService } from "./products.service.js";

@Controller("products")
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    async findAll(
        @Query() query: FindAllProductsDto,
    ): Promise<{ products: Product[]; total: number }> {
        return await this.productsService.findAll(
            query.page ?? 1,
            query.pageSize ?? 25,
        );
    }

    @Post()
    async create(
        @Body() createProductBody: CreateProductDto,
    ): Promise<{ id: number }> {
        return {
            id: await this.productsService.create(createProductBody),
        };
    }

    @Get(":id")
    async findOne(@Param() param: FindOneProductDto): Promise<Product> {
        return await this.productsService.findOne(param.id);
    }

    @Patch(":id")
    async update(
        @Param() param: UpdateProductParamDto,
        @Body() updateProductBody: UpdateProductBodyDto,
    ): Promise<Product> {
        return await this.productsService.update(param.id, updateProductBody);
    }

    @Delete(":id")
    async delete(@Param() param: DeleteProductDto): Promise<{ id: number }> {
        await this.productsService.delete(param.id);

        return { id: param.id };
    }
}
