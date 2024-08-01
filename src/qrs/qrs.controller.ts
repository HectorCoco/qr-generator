import { Controller, Query, Get, Post, Body, Put, Patch, Param, Delete, UseInterceptors, UploadedFiles, } from '@nestjs/common';
import { QrsService } from './qrs.service';
import { CreateQrDto } from './dto/create-qr.dto';
import { UpdateQrDto } from './dto/update-qr.dto';
import QrResponseDTO from './dto/qr-response.dto';
import { QrDocument } from './entities/qr.entity';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('qrs')
export class QrsController {

  constructor(private readonly qrsService: QrsService) { }

  @Post()
  @UseInterceptors(FilesInterceptor('files'))
  async create(
    @Body() createQrDto: CreateQrDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ): Promise<QrResponseDTO> {
    // Llamar al servicio para crear el QR y manejar los archivos
    return this.qrsService.create(createQrDto, files);
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
  @UseInterceptors(FilesInterceptor('files')) // Interceptor para manejar múltiples archivos
  async update(
    @Param('term') term: string, // Parámetro en la URL para identificar el QR a actualizar
    @Body() updateQrDto: UpdateQrDto, // DTO con los datos para actualizar
    @UploadedFiles() files: Array<Express.Multer.File>, // Archivos subidos
  ) {
    return this.qrsService.update(term, updateQrDto, files); // Llama al servicio para actualizar el QR
  }

  @Delete(':id')
  remove(@Param('id') id: string) {

    return this.qrsService.remove(id)
  }

}