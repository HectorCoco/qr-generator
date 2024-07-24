import { ImageDocument } from 'src/images/entities/image.entity';
import { QrDocument } from "src/qrs/entities/qr.entity";

export default class ImageResponseDTO {
    // Constructor initializes properties based on provided arguments
    constructor(
        public _id: string,
        public name: string,
        public imageReference: string,
        public order: any,
        public active: boolean,
        public createdAt: string,
        public modifiedAt: string,
        public qr: QrDocument,

    ) { }
    // Static method to convert a PostDocument to a PostResponseDTO instance
    static from(image: ImageDocument): ImageResponseDTO { // Añadir un parámetro images que es un array

        return new ImageResponseDTO(
            image._id.toString(),
            image.name,
            image.imageReference,
            image.order,
            image.active,
            image.createdAt,
            image.modifiedAt,
            image.qr
        )
    }
}