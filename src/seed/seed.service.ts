import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Promise } from 'mongoose';
import { Location } from 'src/locations/entities/location.entity';
import { Locations } from './interfaces/location.interface';
import { Category } from 'src/categories/entities/category.entity';
import { Categories } from './interfaces/category.interface';


@Injectable()
export class SeedService {


  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<Location>,
    @InjectModel(Category.name)
    private readonly categoryModel: Model<Category>
  ) { }


  async executeSeed() {

    await this.locationModel.deleteMany({}) // delete * from locations
    await this.categoryModel.deleteMany({}) // delete * from categories

    const locations = Locations

    const locationsToInsert: { locationNumber: number, name: string }[] = []

    locations.forEach(({ locationNumber, name }) => {

      locationsToInsert.push({ locationNumber, name })

    });

    this.locationModel.insertMany(locationsToInsert)


    const categories = Categories

    const categoriesToInsert: { categoryType: string, name: string }[] = []

    categories.forEach(({ categoryType, name }) => {

      categoriesToInsert.push({ categoryType, name })

    });

    this.categoryModel.insertMany(categoriesToInsert)

    return { "msg": 'Seed ejecutada' }



  }


}
