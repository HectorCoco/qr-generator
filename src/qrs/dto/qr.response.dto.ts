import { LocationDocument } from 'src/locations/entities/location.entity';
import { QrDocument } from '../entities/qr.entity';

export default class QrResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        // ID of the post
        public _id: string,
        // Title of the post
        public name: string,
        public location: LocationDocument
        // Body/content of the post
    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from = (qr: QrDocument): QrResponseDTO =>
        new QrResponseDTO(
            // Convert MongoDB ObjectId to its hexadecimal representation
            qr._id.toString(),
            qr.name,
            qr.location

        );
}