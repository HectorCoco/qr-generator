import { IsInt, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateImageDto {

    @IsString()
    @MinLength(1)
    name: string

    @IsString()
    @MinLength(1)
    image: string

    @IsInt()
    @IsPositive()
    @Min(1)
    order: number

}
