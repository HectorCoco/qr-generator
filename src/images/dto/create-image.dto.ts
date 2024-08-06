import { Transform } from "class-transformer";
import { IsInt, IsMongoId, IsPositive, IsString, Min, MinLength } from "class-validator";

export class CreateImageDto {

    // @IsString()
    // @MinLength(1)
    name?: string

    // @IsString()
    // @MinLength(1)
    s3Reference?: string

    @Transform(({ value }) => parseInt(value, 10))
    @IsInt()
    @Min(1)
    order: number;

    // @IsString()
    @IsMongoId()
    // @IsObject()
    qr: string


}
