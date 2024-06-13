import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { Link } from './entities/link.entity';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class LinksService {

  constructor(
    @InjectModel(Link.name)
    private readonly linkModel: Model<Link>
  ) { }

  async create(createLinkDto: CreateLinkDto) {
  
    createLinkDto.name = createLinkDto.name.toLocaleLowerCase()

    try {

      const link = await this.linkModel.create(createLinkDto)
      return link

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async findAll() {

    return await this.linkModel.find()
  }

  async findOne(term: string) {

    let link: Link

    // if (!isNaN(+term)) {
    //   link = await this.linkModel.findOne({ link_number: term })
    // }

    // MongoID
    if (!link && isValidObjectId(term)) {
      link = await this.linkModel.findById(term)
    }
    // Name
    if (!link) {
      link = await this.linkModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!link) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

    return link
  }

  async update(term: string, updateLinkDto: UpdateLinkDto) {

    const link = await this.findOne(term)

    if (updateLinkDto.name) {
      updateLinkDto.name = updateLinkDto.name.toLowerCase()
    }
    // if (updateLinkDto.value) {
    //   updateLinkDto.value = updateLinkDto.value
    // }

    try {
      await link.updateOne(updateLinkDto)
      return { ...link.toJSON(), ...updateLinkDto }

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }

  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.linkModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }
    return { "msg": "Registro eliminado exitosamente" }

  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Ya existe registro en la base de datos ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`No se puede crear el registro, favor de checar en consola`)

  }
}
