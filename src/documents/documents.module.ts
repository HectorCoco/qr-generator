import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { Document, DocumentSchema } from './entities/document.entity';

@Module({
  controllers: [DocumentsController],
  providers: [DocumentsService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Document.name,
        schema: DocumentSchema
      }
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class DocumentsModule { }
