import { IsBoolean, IsInt, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateLocationDto {

    @IsInt()
    @IsPositive()
    @Min(1)
    location_number: number

    @IsString()
    @MinLength(1)
    name: string



}
