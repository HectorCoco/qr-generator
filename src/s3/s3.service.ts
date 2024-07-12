import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Credentials } from 'src/s3-credentials';

@Injectable()
export class S3Service {
    private readonly s3Client: S3Client;

    constructor() {
        const credentials = s3Credentials()
        this.s3Client = new S3Client({
            region: credentials.region, // Reemplaza con tu región de AWS
            credentials: {
                accessKeyId: credentials.credentials.accessKeyId, // Reemplaza con tu access key
                secretAccessKey: credentials.credentials.secretAccessKey, // Reemplaza con tu secret key
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
