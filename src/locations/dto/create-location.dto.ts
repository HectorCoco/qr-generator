import { IsBoolean, IsInt, IsNotEmpty, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateLocationDto {

    @IsInt()
    @IsPositive()
    @Min(1)
    @IsNotEmpty({ message: 'La propiedad del campo es incorrecta' })
    locationNumber: number

    @IsString()
    @MinLength(1)
    @IsNotEmpty({ message: 'La propiedad del campo es incorrecta' })
    name: string



}
