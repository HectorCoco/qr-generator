import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';
import { IsString } from 'class-validator';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {

    // @IsString()
    modifiedAt?: string

}
