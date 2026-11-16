import { Type } from "class-transformer";
import { IsInt, Min } from "class-validator";

export class DeleteProductDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    id: number;
}
