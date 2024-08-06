import { FileDocument } from '../entities/file.entity';
import { QrDocument } from "src/qrs/entities/qr.entity";

export default class DocumentResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        public id: string,
        public name: string,
        public s3Reference: string,
        public active: boolean,
        public createdAt: string,
        public modifiedAt: string,
        public qr: QrDocument,

    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from(file: FileDocument): DocumentResponseDTO { // Añadir un parámetro files que es un array

        return new DocumentResponseDTO(
            file._id.toString(),
            file.name,
            file.s3Reference,
            file.active,
            file.createdAt,
            file.modifiedAt,
            file.qr
        )
    }
}