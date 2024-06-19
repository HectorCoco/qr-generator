import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsService } from './locations.service';
import { LocationsController } from './locations.controller';
import { Location, LocationSchema } from './entities/location.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';

@Module({
  controllers: [LocationsController],
  providers: [LocationsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Location.name,
        schema: LocationSchema,
      },
      {
        name: Qr.name,
        schema: QrSchema,
      },
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class LocationsModule { }
