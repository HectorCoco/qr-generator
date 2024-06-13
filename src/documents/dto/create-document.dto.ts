import { IsString, MinLength } from "class-validator"

export class CreateDocumentDto {

    @IsString()
    @MinLength(1)
    name: string

    @IsString()
    @MinLength(1)
    value: string

}
