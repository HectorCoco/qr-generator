import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location, LocationSchema } from './entities/location.entity';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Location.name,
        schema: LocationSchema,
      }
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class LocationsModule { }
