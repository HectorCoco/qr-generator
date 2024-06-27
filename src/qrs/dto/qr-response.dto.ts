import { LocationDocument } from 'src/locations/entities/location.entity';
import { QrDocument } from '../entities/qr.entity';
import { CategoryDocument } from 'src/categories/entities/category.entity';

export default class QrResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        public _id: string,
        public name: string,
        public qrUrl: string,
        public createdAt: string,
        public modifiedAt: string,
        public location: LocationDocument,
        public category: CategoryDocument

    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from = ({
        _id,
        name,
        qrUrl,
        createdAt,
        modifiedAt,
        location,
        category,
    }: QrDocument): QrResponseDTO =>
        new QrResponseDTO(
            // Convert MongoDB ObjectId to its hexadecimal representation
            _id.toString(),
            name,
            qrUrl,
            createdAt,
            modifiedAt,
            location,
            category
        )
}