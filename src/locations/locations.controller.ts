import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import LocationResponseDTO from './dto/location-response.dto';
import { CreateQrDto } from '../qrs/dto/create-qr.dto';
import QrResponseDTO from 'src/qrs/dto/qr.response.dto';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) { }


  @Get('count')
  count(): Promise<number> {
    return this.locationsService.count()
  }

  @Post()
  // @HttpCode(HttpStatus.OK)
  create(@Body() createLocationDto: CreateLocationDto): Promise<LocationResponseDTO> {
    return this.locationsService.create(createLocationDto);
  }


  @Post(':id/qrs')
  addQr(
    @Param('id') id: string,
    @Body() requestDto: CreateQrDto,
  ): Promise<QrResponseDTO> {
    return this.locationsService.addQr(id, requestDto);
  }
  @Get()
  findAll() {
    return this.locationsService.findAll();
  }

  @Get(':term')
  findOne(@Param('term') term: string) {
    return this.locationsService.findOne(term);
  }

  @Patch(':term')
  update(@Param('term') term: string, @Body() updateLocationDto: UpdateLocationDto) {
    return this.locationsService.update(term, updateLocationDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseMongoIdPipe) id: string) {
    return this.locationsService.remove(id);
  }
}
