import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { LocationsModule } from 'src/locations/locations.module';
import { CategoriesModule } from 'src/categories/categories.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    LocationsModule,
    CategoriesModule,
  ],

})
export class SeedModule { }
