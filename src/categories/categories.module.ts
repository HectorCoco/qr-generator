import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, CategorySchema } from './entities/category.entity';
import { Qr, QrSchema } from 'src/qrs/entities/qr.entity';

@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  imports: [
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Qr.name,
        schema: QrSchema,
      }
    ])
  ],
  exports: [
    MongooseModule
  ],
})
export class CategoriesModule { }
