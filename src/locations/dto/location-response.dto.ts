import { LocationDocument } from 'src/locations/entities/location.entity';

export default class LocationResponseDTO {

    constructor(
        public id: string,
        public locationNumber: number,
        public name: string,
        public active: boolean,
        public createdAt: string,
        public modifiedAt?: string,
        public qrs?: Array<any>,
    ) { }

    static from = ({
        _id,
        locationNumber,
        name,
        active,
        createdAt,
        modifiedAt,
        qrs,
    }: LocationDocument): LocationResponseDTO =>
        new LocationResponseDTO(
            _id.toHexString(),
            locationNumber,
            name,
            active,
            createdAt,
            modifiedAt,
            qrs
        )

}