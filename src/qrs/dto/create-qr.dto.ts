import { IsArray, IsMongoId, IsNotEmpty, IsObject, IsString, MinLength, ValidateNested } from "class-validator";



export class CreateQrDto {

    @IsString()
    @MinLength(1)
    name: string

    // @IsString()
    // @MinLength(1)
    qrUrl?: string

    // @IsString()
    @IsMongoId()
    // @IsObject()
    location: string

    // @IsString()
    @IsMongoId()
    // @IsObject()
    category: string

}
