import { IsString, MinLength, IsInt, IsPositive, Min, IsNotEmpty } from 'class-validator';


export class CreateCategoryDto {

    @IsString()
    @MinLength(1)
    @IsNotEmpty({ message: 'La propiedad del campo es incorrecta' })
    categoryType: string

    @IsString()
    @MinLength(1)
    @IsNotEmpty({ message: 'La propiedad del campo es incorrecta' })
    name: string

}
