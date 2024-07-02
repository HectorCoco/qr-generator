import { FileDocument } from '../entities/file.entity';
import { QrDocument } from "src/qrs/entities/qr.entity";

export default class DocumentResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        public id: string,
        public name: string,
        public documenttReference: string,
        public active: boolean,
        public createdAt: string,
        public modifiedAt: string,
        public qr: QrDocument,

    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from = ({
        _id,
        name,
        documentReference,
        active,
        createdAt,
        modifiedAt,
        qr,
    }: FileDocument): DocumentResponseDTO =>
        new DocumentResponseDTO(
            // Convert MongoDB ObjectId to its hexadecimal representation
            _id.toString(),
            name,
            documentReference,
            active,
            createdAt,
            modifiedAt,
            qr
        )
}