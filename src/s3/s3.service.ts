import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;

    constructor() {
        this.s3Client = new S3Client({
            region: 'us-west-1', // Reemplaza con tu región de AWS
            credentials: {
                accessKeyId: 'AKIAT5EP7DKSMVBJDXAR', // Reemplaza con tu access key
                secretAccessKey: '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', // Reemplaza con tu secret key
            },
        });
    }

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
}
