import { LocationDocument } from 'src/locations/entities/location.entity';

export default class LocationResponseDTO {

    constructor(
        public id: string,
        public location_number: number,
        public name: string,
        public active: boolean,
        public created_at: number,
        public modified_at?: number,
        public qrs?: Array<any>,
    ) { }

    static from = ({

        _id,
        location_number,
        name,
        active,
        created_at,
        modified_at,
        qrs,
    }: LocationDocument): LocationResponseDTO =>
        new LocationResponseDTO(
            _id.toHexString(),
            location_number,
            name,
            active,
            created_at,
            modified_at,
            qrs)


}