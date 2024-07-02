import { Controller, Query, Get, Post, Body, Patch, Param, Delete, UseInterceptors } from '@nestjs/common';
import { QrsService } from './qrs.service';
import { CreateQrDto } from './dto/create-qr.dto';
import { UpdateQrDto } from './dto/update-qr.dto';
import QrResponseDTO from './dto/qr-response.dto';
import { QrDocument } from './entities/qr.entity';


@Controller('qrs')
export class QrsController {

  constructor(private readonly qrsService: QrsService) { }

  @Post()
  create(
    @Body() createQrDto: CreateQrDto): Promise<QrResponseDTO> {

    return this.qrsService.create(createQrDto)
  }


  @Get()
  findAll(
    @Query('location') location?: string,
    @Query('category') category?: string,
  ): Promise<Array<QrResponseDTO>> {

    return this.qrsService.findQrsWithFilters(location, category)
  }

  @Get(':term')
  findOne(@Param('term') term: string): Promise<QrDocument> {

    return this.qrsService.findOne(term)
  }

  @Get('search/:term')
  search(@Param('term') term: string) {

    return this.qrsService.search(term)
  }

  @Patch(':term')
  update(@Param('term') term: string, @Body() updateQrDto: UpdateQrDto): Promise<QrResponseDTO> {

    return this.qrsService.update(term, updateQrDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {

    return this.qrsService.remove(id)
  }
}
