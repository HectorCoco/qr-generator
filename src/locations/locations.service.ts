import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { validateOrReject } from 'class-validator';
import LocationResponseDTO from './dto/location-response.dto';
import QrResponseDTO from 'src/qrs/dto/qr-response.dto';
import { LocationDocument } from './entities/location.entity';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { CreateQrDto } from 'src/qrs/dto/create-qr.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { handleExceptions } from '../common/helpers/handle-exceptions.helper';

@Injectable()
export class LocationsService {

  constructor(
    @InjectModel('Location')
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>
  ) { }

  async count(): Promise<number> {

    try {
      return await this.locationModel.countDocuments().exec()

    } catch (error) {

      console.log(error)
      handleExceptions(error)

    }
  }

  async create(createLocationDto: CreateLocationDto): Promise<LocationResponseDTO> {

    await validateOrReject(createLocationDto)

    try {
      const newLocation = new this.locationModel()
      newLocation.locationNumber = createLocationDto.locationNumber
      newLocation.name = createLocationDto.name.toLowerCase()
      const location = await newLocation.save()

      return LocationResponseDTO.from(location)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }

  }

  async addQr(id: string, requestDto: CreateQrDto,): Promise<QrResponseDTO> {
    await validateOrReject(requestDto)

    try {
      const newQr = new this.qrModel(requestDto)
      const _id = new Types.ObjectId(id)
      const location = await this.locationModel.findById(_id).exec()
      newQr.location = location
      const qr = await newQr.save()

      return QrResponseDTO.from(qr)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findAll(): Promise<Array<LocationResponseDTO>> {
    try {
      const locations = await this.locationModel.find().exec()

      return locations.map(LocationResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findOne(term: string): Promise<LocationDocument> {

    const isMongoId = Types.ObjectId.isValid(term)
    let location: LocationDocument | null

    if (isMongoId) {
      location = await this.locationModel.findById(term).exec()
    } else {
      location = await this.locationModel.findOne({ name: term }).exec()
    }

    if (!location) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return location
  }

  async update(term: string, updateLocationDto: UpdateLocationDto): Promise<LocationResponseDTO> {

    // Encuentra el documento Mongoose usando el término
    const location = await this.findOne(term)

    // Si no se encuentra, lanza una excepción
    if (!location) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    updateLocationDto.modifiedAt = new Date().toISOString().split('T')[0]

    // Actualiza las propiedades del documento
    if (updateLocationDto.name) {
      updateLocationDto.name = updateLocationDto.name.toLowerCase()
    }


    try {
      Object.assign(location, updateLocationDto)
      const updatedLocation = await location.save()

      return LocationResponseDTO.from(location)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.locationModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Registro eliminado exitosamente" }

  }
  // private handleExceptionss(error: any) {
  //   if (error.code === 11000) {
  //     throw new BadRequestException(`Ya existe registro en la base de datos ${JSON.stringify(error.keyValue)}`)
  //   }
  //   throw new InternalServerErrorException(`No se puede crear el registro, favor de checar en consola`)

  // }
}
