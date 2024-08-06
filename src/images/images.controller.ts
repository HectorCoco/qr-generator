import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import ImageResponseDTO from './dto/image-response.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('images')
export class ImagesController {
  constructor(
    private readonly imagesService: ImagesService
  ) { }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createImageDto: CreateImageDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageResponseDTO> {

    return this.imagesService.create(createImageDto, file);
  }

  @Get()
  findAll(
    @Query('qr') qr?: string,
  ): Promise<Array<ImageResponseDTO>> {

    return this.imagesService.findImagesWithFilters(qr)
  }

  @Get(':term')
  findOne(@Param('term') term: string) {

    return this.imagesService.findOne(term)
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  async update(
    @Param('id') id: string,
    @Body() updateImageDto: UpdateImageDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImageResponseDTO> {
    return this.imagesService.update(id, updateImageDto, file);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }

}
