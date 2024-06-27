import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './entities/category.entity';
import { Model, Types, isValidObjectId } from 'mongoose';
import { validateOrReject } from 'class-validator';
import CategoryResponseDTO from './dto/category-response.dto';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';

@Injectable()
export class CategoriesService {

  constructor(
    @InjectModel('Category')
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>
  ) { }

  async count(): Promise<number> {

    try {
      return await this.categoryModel.countDocuments().exec()

    } catch (error) {

      console.log(error)
      handleExceptions(error)

    }
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDTO> {

    createCategoryDto.name = createCategoryDto.name.toLocaleLowerCase()

    await validateOrReject(createCategoryDto)

    try {
      const newCategory = new this.categoryModel()
      newCategory.categoryType = createCategoryDto.categoryType.toLowerCase()
      newCategory.name = createCategoryDto.name.toLowerCase()
      const category = await newCategory.save()

      return CategoryResponseDTO.from(category)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findAll() {
    try {
      const categories = await this.categoryModel.find().exec()

      return categories.map(CategoryResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findOne(term: string) {

    const isMongoId = Types.ObjectId.isValid(term)
    let category: CategoryDocument | null

    if (isMongoId) {

      category = await this.categoryModel.findById(term).exec()

    } else {

      category = await this.categoryModel.findOne({ name: term }).exec()

    }

    if (!category) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return category
  }

  async update(term: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryResponseDTO> {

    // Encuentra el documento Mongoose usando el término
    const category = await this.findOne(term)

    // Si no se encuentra, lanza una excepción
    if (!category) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    // Actualiza las propiedades del documento
    if (updateCategoryDto.categoryType) {
      updateCategoryDto.categoryType = updateCategoryDto.categoryType.toLowerCase()
    }
    if (updateCategoryDto.name) {
      updateCategoryDto.name = updateCategoryDto.name.toLowerCase()
    }

    updateCategoryDto.modifiedAt = new Date().toISOString().split('T')[0]

    try {
      Object.assign(category, updateCategoryDto)
      const updatedCategory = await category.save()

      return CategoryResponseDTO.from(updatedCategory)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }


  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.categoryModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Registro eliminado exitosamente" }

  }

}
