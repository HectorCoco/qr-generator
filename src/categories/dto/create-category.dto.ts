import { IsString, MinLength, IsInt, IsPositive, Min } from 'class-validator';


export class CreateCategoryDto {

    @IsInt()
    @IsPositive()
    @Min(1)
    category_number: number

    @IsString()
    @MinLength(1)
    name: string

}
