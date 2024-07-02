import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FilesService } from './files.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import DocumentResponseDTO from './dto/document-response.dto';

@Controller('files')
export class FilesController {
  constructor(private readonly documentsService: FilesService) { }

  @Post()
  create(@Body() createDocumentDto: CreateDocumentDto): Promise<DocumentResponseDTO> {

    return this.documentsService.create(createDocumentDto)
  }

  @Get()
  findAll(
    @Query('qr') qr?: string,
  ): Promise<Array<DocumentResponseDTO>> {

    return this.documentsService.findDocumentsWithFilters(qr)
  }

  @Get(':term')
  findOne(@Param('term') term: string) {

    return this.documentsService.findOne(term)
  }

  @Patch(':term')
  update(@Param('term') term: string, @Body() updateDocumentDto: UpdateDocumentDto) {

    return this.documentsService.update(term, updateDocumentDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {

    return this.documentsService.remove(id)
  }
}
