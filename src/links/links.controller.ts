import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import LinkResponseDTO from './dto/link-response.dto';

@Controller('links')
export class LinksController {

  constructor(private readonly linksService: LinksService) { }

  @Post()
  create(@Body() createLinkDto: CreateLinkDto): Promise<LinkResponseDTO> {

    return this.linksService.create(createLinkDto)
  }

  @Get()
  findAll(
    @Query('qr') qr?: string,
  ): Promise<Array<LinkResponseDTO>> {

    return this.linksService.findLinksWithFilters(qr)
  }

  @Get(':term')
  findOne(@Param('term') term: string) {

    return this.linksService.findOne(term)
  }

  @Patch(':term')
  update(@Param('term') term: string, @Body() updateLinkDto: UpdateLinkDto) {

    return this.linksService.update(term, updateLinkDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {

    return this.linksService.remove(id)
  }

}
