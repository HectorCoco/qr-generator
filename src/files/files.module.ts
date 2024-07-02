import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { File, FileSchema } from 'src/files/entities/file.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';

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
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class FilesModule { }
