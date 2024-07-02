import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { Image, ImageSchema } from './entities/image.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Image.name,
        schema: ImageSchema,
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
export class ImagesModule { }
