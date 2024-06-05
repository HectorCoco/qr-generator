import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, MongooseError, Promise } from 'mongoose';
import { Location } from 'src/locations/entities/location.entity';
import { Locations } from './interfaces/location.interface';


@Injectable()
export class SeedService {


  constructor(
    @InjectModel(Location.name)
    private readonly locationModel: Model<Location>
  ) { }


  async executeSeed() {

    await this.locationModel.deleteMany({}) // delete * from locations

    const locations = Locations

    const dataToInsert: { location_number: number, name: string }[] = []

    locations.forEach(({ location_number, name }) => {

      // const location = await this.locationModel.create({ location_number, name })
      dataToInsert.push({ location_number, name })

    });

    this.locationModel.insertMany(dataToInsert)

    // await Promise.all(insertPromisesArray)

    return { "msg": 'Seed ejecutada' }



  }


}
