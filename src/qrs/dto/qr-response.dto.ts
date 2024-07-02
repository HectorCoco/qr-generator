import { LocationDocument } from 'src/locations/entities/location.entity';
import { QrDocument } from '../entities/qr.entity';
import { CategoryDocument } from 'src/categories/entities/category.entity';
import { ImageDocument } from 'src/images/entities/image.entity';

export default class QrResponseDTO {
    constructor(
        public _id: string,
        public name: string,
        public qrUrl: string,
        public active: boolean,
        public createdAt: string,
        public modifiedAt: string,
        public location: LocationDocument,
        public category: CategoryDocument,
        public qrData: any,
    ) { }

    static from(qr: QrDocument): QrResponseDTO { // Añadir un parámetro images que es un array

        return new QrResponseDTO(
            qr._id.toString(),
            qr.name,
            qr.qrUrl,
            qr.active,
            qr.createdAt,
            qr.modifiedAt,
            qr.location,
            qr.category,
            qr.qrData
        );
    }
}