import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Post,
    Query,
} from "@nestjs/common";
import { AppService } from "./app.service.js";
import { CreateProductDto } from "./dto/create-product-dto.js";
import {
    UpdateProductBodyDto,
    UpdateProductParamDto,
} from "./dto/update-product-dto.js";
import { ProductType } from "./db/types.js";
import { FindAllProductDto } from "./dto/find-all-product-dto.js";
import { FindOneProductDto } from "./dto/find-one-dto.js";
import { DeleteProductDto } from "./dto/delete-product-dto.js";

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
    async create(
        @Body() createProductBody: CreateProductDto,
    ): Promise<{ id: number }> {
        return {
            id: await this.appService.create(createProductBody),
        };
    }

    @Get(":id")
    async findOne(@Param() param: FindOneProductDto): Promise<ProductType> {
        return await this.appService.findOne(param.id);
    }

    @Post(":id")
    async update(
        @Param() param: UpdateProductParamDto,
        @Body() updateProductBody: UpdateProductBodyDto,
    ): Promise<{ id: number }> {
        await this.appService.update(param.id, updateProductBody);

        return { id: param.id };
    }

    @Delete(":id")
    async delete(@Param() param: DeleteProductDto): Promise<{ id: number }> {
        await this.appService.delete(param.id);

        return { id: param.id };
    }
}
