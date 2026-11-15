import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Min,
} from "class-validator";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    price: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    stock: number;
}
