import { Module } from '@nestjs/common';
import { QrsService } from './qrs.service';
import { QrsController } from './qrs.controller';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { Qr, QrSchema } from './entities/qr.entity';
import { Location, LocationSchema } from 'src/locations/entities/location.entity';

@Module({
  controllers: [QrsController],
  providers: [QrsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Qr.name,
        schema: QrSchema,
      },
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
export class QrsModule { }
