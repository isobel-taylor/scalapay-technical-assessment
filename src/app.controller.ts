import { Body, Controller, Delete, Get, Param, Post } from "@nestjs/common";
import { AppService } from "./app.service.js";
import { CreateProductDto } from "./dto/create-product-dto.js";
import { UpdateProductDto } from "./dto/update-product-dto.js";

@Controller("products")
export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()
    findAll(): string {
        return this.appService.findAll();
    }

    @Post()
    create(@Body() createProductBody: CreateProductDto): string {
        return this.appService.create(createProductBody);
    }

    @Get(":id")
    findOne(@Param("id") id: number): string {
        return this.appService.findOne(id);
    }

    @Post(":id")
    update(
        @Param("id") id: number,
        @Body() updateProductBody: UpdateProductDto,
    ): string {
        return this.appService.update(id, updateProductBody);
    }

    @Delete(":id")
    delete(@Param("id") id: number): string {
        return this.appService.delete(id);
    }
}
