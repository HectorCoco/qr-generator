import { PartialType } from '@nestjs/mapped-types';
import { CreateDocumentDto } from './create-document.dto';
import { IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateDocumentDto extends PartialType(CreateDocumentDto) {

    modifiedAt?: string

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    active?: boolean;
}
