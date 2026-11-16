import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    Param,
    Post,
    Query,
} from "@nestjs/common";
import { AppService } from "./app.service.js";
import { CreateProductDto } from "./dto/create-product-dto.js";
import { UpdateProductDto } from "./dto/update-product-dto.js";
import { ProductType } from "./db/types.js";
import { FindAllProductDto } from "./dto/find-all-product-dto.js";

@Controller("products")
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    async findAll(@Query() query: FindAllProductDto): Promise<ProductType[]> {
        return await this.appService.findAll(
            query.page ?? 1,
            query.pageSize ?? 25,
        );
    }

    @Post()
    async create(@Body() createProductBody: CreateProductDto): Promise<number> {
        return await this.appService.create(createProductBody);
    }

    @Get(":id")
    async findOne(@Param("id") id: number): Promise<ProductType> {
        const product = await this.appService.findOne(id);

        if (product === null) {
            throw new HttpException("Product not found", 404);
        }

        return product;
    }

    @Post(":id")
    async update(
        @Param("id") id: number,
        @Body() updateProductBody: UpdateProductDto,
    ): Promise<void> {
        await this.appService.update(id, updateProductBody);
    }

    @Delete(":id")
    async delete(@Param("id") id: number): Promise<void> {
        await this.appService.delete(id);
    }
}
