import { IsInt, IsMongoId, IsPositive, IsString, MinLength } from "class-validator";

export class CreateLinkDto {

    @IsString()
    @MinLength(1)
    name: string


    @IsString()
    @MinLength(1)
    url: string

    @IsMongoId()
    qr: string

}
