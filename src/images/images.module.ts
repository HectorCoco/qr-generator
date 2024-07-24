import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { Image, ImageSchema } from './entities/image.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';
import { S3Module } from 'src/s3/s3.module';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

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
    ]),
    S3Module,
    FileUploadModule,
  ],
  exports: [
    MongooseModule,
    ImagesService,
  ],
})

export class ImagesModule { }
