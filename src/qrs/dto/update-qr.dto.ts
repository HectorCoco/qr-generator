import { PartialType } from '@nestjs/mapped-types';
import { CreateQrDto } from './create-qr.dto';
import { IsString } from 'class-validator';

export class UpdateQrDto extends PartialType(CreateQrDto) {

    // @IsString()
    modifiedAt?: string
}
