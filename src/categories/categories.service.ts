import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './entities/category.entity';
import { Model, isValidObjectId } from 'mongoose';

@Injectable()
export class CategoriesService {

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>
  ) { }

  async create(createCategoryDto: CreateCategoryDto) {
    createCategoryDto.name = createCategoryDto.name.toLocaleLowerCase()

    try {

      const location = await this.categoryModel.create(createCategoryDto)
      return location

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }

  }

  findAll() {
    return this.categoryModel.find()
  }

  async findOne(term: string) {
    let category: Category

    // Por numero de categoria //
    if (!isNaN(+term)) {
      category = await this.categoryModel.findOne({ category_number: term })
    }

    // MongoID
    if (!category && isValidObjectId(term)) {
      category = await this.categoryModel.findById(term)
    }
    // Name
    if (!category) {
      category = await this.categoryModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!category) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

    return category
  }

  async update(term: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOne(term)

    if (updateCategoryDto.name) {
      updateCategoryDto.name = updateCategoryDto.name.toLowerCase()
    }
    // updateLocationDto.modified_at = new Date().getTime()

    try {
      await category.updateOne(updateCategoryDto)
      return { ...category.toJSON(), ...updateCategoryDto }

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.categoryModel.deleteOne({ _id: id })

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
