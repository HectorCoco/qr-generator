import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { Image, ImageSchema } from './entities/image.entity';

@Module({
  controllers: [ImagesController],
  providers: [ImagesService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Image.name,
        schema: ImageSchema,
      }
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class ImagesModule { }
