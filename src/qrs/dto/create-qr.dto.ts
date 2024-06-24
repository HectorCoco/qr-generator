import { IsArray, IsMongoId, IsNotEmpty, IsObject, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Location } from "src/locations/entities/location.entity";
import { UpdateQrDto } from './update-qr.dto';
import { OmitType, PartialType } from "@nestjs/mapped-types";


export class CreateQrDto {

    @IsString()
    @MinLength(1)
    name: string

    @IsString()
    @MinLength(5)
    qrUrl: string


    @IsString()
    // @IsMongoId()
    // @IsObject()
    location: string

}
