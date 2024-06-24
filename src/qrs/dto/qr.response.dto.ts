import { LocationDocument } from 'src/locations/entities/location.entity';
import { QrDocument } from '../entities/qr.entity';

export default class QrResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        public _id: string,
        public name: string,
        public qrUrl: string,
        public location: LocationDocument

    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from = (qr: QrDocument): QrResponseDTO =>
        new QrResponseDTO(
            // Convert MongoDB ObjectId to its hexadecimal representation
            qr._id.toString(),
            qr.name,
            qr.qrUrl,
            qr.location

        );
}