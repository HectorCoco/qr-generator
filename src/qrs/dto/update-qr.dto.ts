import { PartialType } from '@nestjs/mapped-types';
import { CreateQrDto } from './create-qr.dto';
import { IsBoolean, IsOptional, IsString, isBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateQrDto extends PartialType(CreateQrDto) {

    @IsOptional()
    // @IsDateString()
    modifiedAt?: string;


    // @IsOptional()
    // @IsBoolean()
    // active?: boolean;

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value.trim().toLowerCase() === 'true';
        }
        return !!value; // Convierte a booleano
    }, { toClassOnly: true }) // Asegura que la transformación solo se aplique a la instancia de clase
    @IsBoolean()
    active?: boolean;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsString()
    category?: string;

}
