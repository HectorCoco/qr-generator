import { PartialType } from '@nestjs/mapped-types';
import { CreateQrDto } from './create-qr.dto';
import { IsBoolean, IsString, isBoolean } from 'class-validator';

export class UpdateQrDto extends PartialType(CreateQrDto) {

    // @IsString()
    modifiedAt?: string

    @IsBoolean()
    active?: boolean
}
