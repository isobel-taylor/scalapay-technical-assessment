import {
    IsInt,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Max,
    Min,
} from "class-validator";
import { PRICE_MAX, PRICE_SCALE, STOCK_MAX } from "../db/types.js";
import { MaxCodePoints } from "./max-code-points.js";

export class CreateProductDto {
    @IsString()
    @IsNotEmpty()
    @MaxCodePoints(255)
    name: string;

    @IsNumber({ maxDecimalPlaces: PRICE_SCALE })
    @Min(0)
    @Max(PRICE_MAX)
    price: number;

    @IsOptional()
    @IsInt()
    @Min(0)
    @Max(STOCK_MAX)
    stock?: number;
}
