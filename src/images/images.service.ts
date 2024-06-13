import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Image } from './entities/image.entity';
import { Model, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class ImagesService {

  constructor(
    @InjectModel(Image.name)
    private readonly imageModel: Model<Image>
  ) { }

  async create(createImageDto: CreateImageDto) {
    createImageDto.name = createImageDto.name.toLocaleLowerCase()

    try {
      const image = await this.imageModel.create(createImageDto)
      return image
    }
    catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
    // catch {
    //   return 'Eres muy bruto'
    // }
  }

  async findAll() {

    return await this.imageModel.find()

  }

  async findOne(term: string) {
    let image: Image

    // MongoID
    if (!image && isValidObjectId(term)) {
      image = await this.imageModel.findById(term)
    }
    // Name
    if (!image) {
      image = await this.imageModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!image) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

    return image
  }

  async update(term: string, updateImageDto: UpdateImageDto) {

    const image = await this.findOne(term)

    if (updateImageDto.name) {
      updateImageDto.name = updateImageDto.name.toLowerCase()
    }
    // if (updateLinkDto.value) {
    //   updateLinkDto.value = updateLinkDto.value
    // }

    try {
      await image.updateOne(updateImageDto)
      return { ...image.toJSON(), ...updateImageDto }

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async remove(id: string) {
    const { deletedCount, acknowledged } = await this.imageModel.deleteOne({ _id: id })

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
