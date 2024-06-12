import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LinksService } from './links.service';
import { LinksController } from './links.controller';
import { Link, LinkSchema } from './entities/link.entity';

@Module({
  controllers: [LinksController],
  providers: [LinksService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Link.name,
        schema: LinkSchema,
      }
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class LinksModule { }
