// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [],
    exports: [],
})
export class CommonModule { }
