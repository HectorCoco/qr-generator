import { IsInt, IsMongoId, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateImageDto {

    @IsString()
    @MinLength(1)
    name: string

    @IsString()
    @MinLength(1)
    imageReference: string

    @IsInt()
    @IsPositive()
    @Min(1)
    order: number

    // @IsString()
    @IsMongoId()
    // @IsObject()
    qr: string
}
