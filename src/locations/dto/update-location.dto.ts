import { PartialType } from '@nestjs/mapped-types';
import { CreateLocationDto } from './create-location.dto';
import { IsInt, Min, } from 'class-validator';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {

    // @IsInt()
    // @Min(1)
    // modifiedAt: number
}
