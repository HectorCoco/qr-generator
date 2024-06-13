import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Location } from './entities/location.entity';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class LocationsService {

  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<Location>
  ) { }

  async create(createLocationDto: CreateLocationDto) {

    createLocationDto.name = createLocationDto.name.toLocaleLowerCase()

    try {

      const location = await this.locationModel.create(createLocationDto)
      return location

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }

  }

  async findAll() {
    return await this.locationModel.find()
  }

  async findOne(term: string) {

    let location: Location

    if (!isNaN(+term)) {
      location = await this.locationModel.findOne({ location_number: term })
    }

    // MongoID
    if (!location && isValidObjectId(term)) {
      location = await this.locationModel.findById(term)
    }
    // Name
    if (!location) {
      location = await this.locationModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!location) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

    return location
  }

  async update(term: string, updateLocationDto: UpdateLocationDto) {

    const location = await this.findOne(term)

    if (updateLocationDto.name) {
      updateLocationDto.name = updateLocationDto.name.toLowerCase()
    }

    try {
      await location.updateOne(updateLocationDto)
      return { ...location.toJSON(), ...updateLocationDto }

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
    // return ({ location, updateLocationDto })
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
