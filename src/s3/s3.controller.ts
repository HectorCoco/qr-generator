import { Controller, Post, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { S3Service } from './s3.service';
import { FilesInterceptor } from '@nestjs/platform-express';

@Controller('s3')
export class S3Controller {
    constructor(private readonly s3Service: S3Service) { }

    @Post('upload')
    @UseInterceptors(FilesInterceptor('files', 10))
    async uploadFile(@UploadedFiles() files: Array<Express.Multer.File>) {

        const uploadResults = await Promise.all(
            files.map(file => this.s3Service.uploadFile(file))
        )

        return uploadResults
    }

}
