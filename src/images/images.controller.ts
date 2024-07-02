import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ImagesService } from './images.service';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import ImageResponseDTO from './dto/image-response.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) { }

  @Post()
  create(
    @Body() createImageDto: CreateImageDto): Promise<ImageResponseDTO> {

    return this.imagesService.create(createImageDto);
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

  @Patch(':term')
  update(@Param('term') term: string, @Body() updateImageDto: UpdateImageDto): Promise<ImageResponseDTO> {

    return this.imagesService.update(term, updateImageDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.imagesService.remove(id);
  }
}
