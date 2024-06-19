import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateLocationDto {

    @IsNotEmpty({ message: 'La propiedad del campo es incorrecta' })
    @IsInt()
    @IsPositive()
    @Min(1)
    location_number: number

    @IsNotEmpty({ message: 'La propiedad del campo es incorrecta' })
    @IsString()
    @MinLength(1)
    name: string



}
