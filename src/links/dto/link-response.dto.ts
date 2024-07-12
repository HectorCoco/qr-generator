import { LinkDocument } from 'src/links/entities/link.entity';
import { QrDocument } from "src/qrs/entities/qr.entity";


export default class LinkResponseDTO {

    constructor(
        public _id: string,
        public name: string,
        public linkReference: string,
        public active: boolean,
        public createdAt: string,
        public modifiedAt: string,
        public qr: QrDocument,
    ) { }

    static from(link: LinkDocument): LinkResponseDTO {
        return new LinkResponseDTO(
            link._id.toString(),
            link.name,
            link.linkReference,
            link.active,
            link.createdAt,
            link.modifiedAt,
            link.qr
        )
    }
}