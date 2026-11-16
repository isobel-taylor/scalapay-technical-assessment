import { Type } from "class-transformer";
import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    MaxLength,
    Min,
} from "class-validator";
import { PRICE_MAX, PRICE_SCALE, STOCK_MAX } from "../db/types.js";

export class UpdateProductBodyDto {
    @IsOptional()
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    name?: string;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: PRICE_SCALE })
    @Min(0)
    @Max(PRICE_MAX)
    price?: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(STOCK_MAX)
    stock?: number;
}

export class UpdateProductParamDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id: number;
}
