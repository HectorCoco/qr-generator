import { Controller, Query, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
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

  // @Post()
  // testUpload(
  //   @Body() test: any) {
  //   const bucketName = "tickets-bucket-service";
  //   const key = "PLDl2+3avPoMLcOZadv1xjwXsehl+fjLV8WP6CVL";
  //   // AKIAT5EP7DKSMVBJDXAR
  //   const fileContent = "This is the content of my file";

  //   uploadFileToS3(bucketName, key, fileContent)
  //   // return ""
  // }

  // @Post('upload')
  // @UseInterceptors(FileInterceptor('file'))
  // async uploadFile(@UploadedFile() file: Express.Multer.File) {
  //   return this.qrsService.uploadFile(file);
  // }
}