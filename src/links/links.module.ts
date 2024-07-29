import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { Link, LinkSchema } from './entities/link.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';

@Module({
  controllers: [LinksController],
  providers: [LinksService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Link.name,
        schema: LinkSchema,
      },
      {
        name: Qr.name,
        schema: QrSchema,
      },
    ])
  ],
  exports: [
    MongooseModule,
    LinksService,
  ],
})
export class LinksModule { }
