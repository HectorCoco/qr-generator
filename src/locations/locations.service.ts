import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { validateOrReject } from 'class-validator';

import LocationResponseDTO from './dto/location-response.dto';
import QrResponseDTO from 'src/qrs/dto/qr.response.dto';
import { LocationDocument } from './entities/location.entity';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateQrDto } from 'src/qrs/dto/create-qr.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LocationsService {

  constructor(
    @InjectModel('Location')
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>
  ) { }

  // async create(createLocationDto: CreateLocationDto) {

  //   createLocationDto.name = createLocationDto.name.toLocaleLowerCase()

  //   try {

  //     const location = await this.locationModel.create(createLocationDto)
  //     return location

  //   } catch (error) {
  //     console.log(error)
  //     this.handleExceptions(error)
  //   }

  // }

  async create(createLocationDto: CreateLocationDto): Promise<LocationResponseDTO> {
    await validateOrReject(createLocationDto)
    try {
      const newLocation = new this.locationModel()
      newLocation.location_number = createLocationDto.location_number;
      newLocation.name = createLocationDto.name;
      const location = await newLocation.save();
      return LocationResponseDTO.from(location);
    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async addQr(
    id: string,
    requestDto: CreateQrDto,
  ): Promise<QrResponseDTO> {
    await validateOrReject(requestDto);
    try {
      const newQr = new this.qrModel(requestDto);
      console.log(newQr)
      const _id = new Types.ObjectId(id);
      const location = await this.locationModel.findById(_id).exec();
      console.log(location);
      newQr.location = location;
      // newQr.creationDate = new Date().toISOString().slice(0, 10);
      const qr = await newQr.save();
      return QrResponseDTO.from(qr);
    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async count(): Promise<number> {

    try {
      return await this.locationModel.countDocuments().exec();

    } catch (error) {

      console.log(error)
      this.handleExceptions(error)

    }
  }

  // async findAll() {
  //   return await this.locationModel.find()
  // }

  async findAll(): Promise<Array<LocationResponseDTO>> {
    try {
      const locations = await this.locationModel.find().exec();
      return locations.map(LocationResponseDTO.from);
    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async findOne(id: string): Promise<LocationResponseDTO> {
    const _id = new Types.ObjectId(id);
    const location = await this.locationModel.findById(_id).exec();
    return LocationResponseDTO.from(location);
  }

  // async findOne(term: string) {

  //   let location: LocationDocument

  //   if (!isNaN(+term)) {
  //     location = await this.locationModel.findOne({ location_number: term })
  //   }

  //   // MongoID
  //   if (!location && isValidObjectId(term)) {
  //     location = await this.locationModel.findById(term)
  //   }
  //   // Name
  //   if (!location) {
  //     location = await this.locationModel.findOne({ name: term.toLowerCase().trim() })
  //   }

  //   if (!location) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

  //   return location
  // }

  async update(term: string, updateLocationDto: UpdateLocationDto) {


    return 'Hola'
    // const location = await this.findOne(term)

    // if (updateLocationDto.name) {
    //   updateLocationDto.name = updateLocationDto.name.toLowerCase()
    // }

    // try {
    //   await location.updateOne(updateLocationDto)
    //   return { ...location.toJSON(), ...updateLocationDto }

    // } catch (error) {
    //   console.log(error)
    //   this.handleExceptions(error)
    // }
    // // return ({ location, updateLocationDto })
  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.locationModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Locación eliminada exitosamente" }

  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Ya existe registro en la base de datos ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`No se puede crear el registro, favor de checar en consola`)

  }
}
