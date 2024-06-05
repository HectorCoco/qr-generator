import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { LocationsModule } from 'src/locations/locations.module';

@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [LocationsModule],
})
export class SeedModule { }
