import { PartialType } from '@nestjs/mapped-types';
import { CreateLinkDto } from './create-link.dto';
import { IsBoolean } from 'class-validator';

export class UpdateLinkDto extends PartialType(CreateLinkDto) {

    modifiedAt?: string

    @IsBoolean()
    active?: boolean

}
