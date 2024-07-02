import { ImageDocument } from '../entities/image.entity';
import { QrDocument } from "src/qrs/entities/qr.entity";

export default class ImageResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        public _id: string,
        public name: string,
        public imageReference: string,
        public order: number,
        public active: boolean,
        public createdAt: string,
        public modifiedAt: string,
        public qr: QrDocument,

    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from = ({
        _id,
        name,
        imageReference,
        order,
        active,
        createdAt,
        modifiedAt,
        qr,
    }: ImageDocument): ImageResponseDTO =>
        new ImageResponseDTO(
            // Convert MongoDB ObjectId to its hexadecimal representation
            _id.toString(),
            name,
            imageReference,
            order,
            active,
            createdAt,
            modifiedAt,
            qr,
        )
}