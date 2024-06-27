import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import CategoryResponseDTO from './dto/category-response.dto';

@Controller('categories')
export class CategoriesController {

  constructor(
    private readonly categoriesService: CategoriesService
  ) { }

  @Get('count')
  count(): Promise<number> {

    return this.categoriesService.count()
  }

  @Post()
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDTO> {

    return this.categoriesService.create(createCategoryDto)
  }

  @Get()
  findAll() {

    return this.categoriesService.findAll()
  }

  @Get(':term')
  findOne(@Param('term') term: string) {

    return this.categoriesService.findOne(term)
  }

  @Patch(':term')
  update(@Param('term') term: string, @Body() updateCategoryDto: UpdateCategoryDto) {

    return this.categoriesService.update(term, updateCategoryDto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {

    return this.categoriesService.remove(id)
  }
}
