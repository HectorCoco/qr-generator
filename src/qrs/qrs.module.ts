// import { Module } from '@nestjs/common';
// import { QrsService } from './qrs.service';
// import { QrsController } from './qrs.controller';
// import { MongooseModule } from '@nestjs/mongoose';
// import { Qr, QrSchema } from './entities/qr.entity';
// import { Location, LocationSchema } from 'src/locations/entities/location.entity';
// import { Category, CategorySchema } from 'src/categories/entities/category.entity';
// import { Image, ImageSchema } from 'src/images/entities/image.entity';
// import { File, FileSchema } from 'src/files/entities/file.entity';
// import { Link, LinkSchema } from 'src/links/entities/link.entity';
// import { S3Module } from 'src/s3/s3.module';
// import { ImagesModule } from 'src/images/images.module';

// @Module({
//   controllers: [QrsController],
//   providers: [QrsService],
//   imports: [
//     MongooseModule.forFeature([
//       {
//         name: Qr.name,
//         schema: QrSchema,
//       },
//       {
//         name: Location.name,
//         schema: LocationSchema,
//       },
//       {
//         name: Category.name,
//         schema: CategorySchema,
//       },
//       {
//         name: Image.name,
//         schema: ImageSchema,
//       },
//       {
//         name: File.name,
//         schema: FileSchema,
//       },
//       {
//         name: Link.name,
//         schema: LinkSchema,
//       },
//     ]),
//     // S3Module,
//     ImagesModule,
//   ],
//   exports: [
//     MongooseModule,
//     QrsModule,
//   ],
// })

// export class QrsModule { }

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
import { S3Module } from 'src/s3/s3.module';
import { ImagesModule } from 'src/images/images.module';

@Module({
  controllers: [QrsController],
  providers: [QrsService],
  imports: [
    MongooseModule.forFeature([
      { name: Qr.name, schema: QrSchema },
      { name: Location.name, schema: LocationSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Image.name, schema: ImageSchema },
      { name: File.name, schema: FileSchema },
      { name: Link.name, schema: LinkSchema },
    ]),
    S3Module,
    ImagesModule,
  ],
  exports: [QrsService],
})
export class QrsModule { }
