import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from './entities/category.entity';
import { Model } from 'mongoose';

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

  findOne(id: number) {
    return `This action returns a #${id} category`;
  }

  update(id: number, updateCategoryDto: UpdateCategoryDto) {
    return `This action updates a #${id} category`;
  }

  remove(id: number) {
    return `This action removes a #${id} category`;
  }
  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`La categoria ya existen en la base de datos ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`Can't create category - Check in console for errors`)

  }
}
