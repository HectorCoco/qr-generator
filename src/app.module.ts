import { join } from 'path';
import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { MongooseModule } from '@nestjs/mongoose';
import { LocationsModule } from './locations/locations.module';
import { CommonModule } from './common/common.module';
import { SeedModule } from './seed/seed.module';
import { CategoriesModule } from './categories/categories.module';
import { LinksModule } from './links/links.module';
import { ImagesModule } from './images/images.module';
import { FilesModule } from './files/files.module';
import { QrsModule } from './qrs/qrs.module';
import { S3Module } from './s3/s3.module';
import { FileUploadModule } from './file-upload/file-upload.module';


@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),


    MongooseModule.forRoot('mongodb://db:27017/qrs-generator?compressors=snappy,zlib'),


    LocationsModule,


    CommonModule,


    SeedModule,


    CategoriesModule,


    LinksModule,


    ImagesModule,


    FilesModule,


    QrsModule,


    S3Module,


    FileUploadModule,
  ],

})
export class AppModule { }
