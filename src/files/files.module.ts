import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File, FileSchema } from 'src/files/entities/file.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';
import { S3Module } from 'src/s3/s3.module';
import { FileUploadModule } from 'src/file-upload/file-upload.module';

@Module({
  controllers: [FilesController],
  providers: [FilesService],
  imports: [
    MongooseModule.forFeature([
      {
        name: File.name,
        schema: FileSchema
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
    FilesService,
  ],
})
export class FilesModule { }
