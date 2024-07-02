import { PartialType } from '@nestjs/mapped-types';
import { CreateImageDto } from './create-image.dto';
import { IsBoolean } from 'class-validator';

export class UpdateImageDto extends PartialType(CreateImageDto) {

    // @IsString()
    modifiedAt?: string

    @IsBoolean()
    active?: boolean
}
