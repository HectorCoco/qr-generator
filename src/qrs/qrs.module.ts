import { Module } from '@nestjs/common';
import { QrsService } from './qrs.service';
import { QrsController } from './qrs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Qr, QrSchema } from './entities/qr.entity';
import { Location, LocationSchema } from 'src/locations/entities/location.entity';
import { Category, CategorySchema } from 'src/categories/entities/category.entity';
import { Image, ImageSchema } from 'src/images/entities/image.entity';
import { File, FileSchema } from 'src/files/entities/file.entity';
import { Link, LinkSchema } from 'src/links/entities/link.entity';

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
      },
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Image.name,
        schema: ImageSchema,
      },
      {
        name: File.name,
        schema: FileSchema,
      },
      {
        name: Link.name,
        schema: LinkSchema,
      },
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class QrsModule { }
