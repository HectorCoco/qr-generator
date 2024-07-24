import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { s3Credentials } from 'src/s3-credentials';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;

    constructor() {
        const _s3Credentials = s3Credentials()
        this.s3Client = new S3Client({
            region: _s3Credentials.region,
            credentials: {
                accessKeyId: _s3Credentials.credentials.accessKeyId,
                secretAccessKey: _s3Credentials.credentials.secretAccessKey,
            },
        })
    }

    // Método para almacenar un archivo en S3
    async uploadFile(file: Express.Multer.File): Promise<any> {

        const bucketName = "tickets-bucket-service"
        const uploadResult = {
            fileName: file.originalname,
            success: false
        }

        const params = {
            Bucket: bucketName,
            Key: file.originalname,
            Body: file.buffer,
        }
        try {
            const command = new PutObjectCommand(params)
            const response = await this.s3Client.send(command)
            uploadResult["success"] = response.$metadata.httpStatusCode == 200
            console.log('File uploaded successfully', uploadResult, response)

        } catch (error) {
            console.error('Error uploading file', error)

        }
        return uploadResult
    }

    // Método para eliminar un archivo de S3
    async deleteFile(key: string): Promise<void> {
        const bucketName = 'tickets-bucket-service';

        const params = {
            Bucket: bucketName,
            Key: key,
        };

        try {
            const command = new DeleteObjectCommand(params);
            await this.s3Client.send(command);
            console.log(`File ${key} deleted from S3`);
        } catch (error) {
            console.error('Error deleting file from S3', error);
            throw new InternalServerErrorException('Error deleting file from S3');
        }
    }

}
