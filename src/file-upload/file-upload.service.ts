import { Injectable } from '@nestjs/common';

@Injectable()
export class FileUploadService {
    handleFileUpload(file: Express.Multer.File): string {
        // Aquí puedes manejar el archivo como desees, por ejemplo, guardarlo en la base de datos, procesarlo, etc.
        return `Archivo ${file.filename} subido exitosamente`;
    }
}
