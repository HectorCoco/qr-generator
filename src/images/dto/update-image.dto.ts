import { PartialType } from '@nestjs/mapped-types';
import { CreateImageDto } from './create-image.dto';
import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateImageDto extends PartialType(CreateImageDto) {

    // @IsString()
    modifiedAt?: string

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    active?: boolean;
}
