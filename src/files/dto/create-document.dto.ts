import { IsMongoId, IsString, MinLength } from "class-validator"

export class CreateDocumentDto {

    @IsString()
    @MinLength(1)
    name: string

    @IsString()
    @MinLength(1)
    documetReference: string

    // @IsString()
    @IsMongoId()
    // @IsObject()
    qr: string
}
