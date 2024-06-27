import { CategoryDocument } from 'src/categories/entities/category.entity';

export default class CategoryResponseDTO {

    constructor(
        public id: string,
        public categoryType: string,
        public name: string,
        public active: boolean,
        public createdAt: string,
        public modifiedAt?: string,
        public qrs?: Array<any>,
    ) { }

    static from = ({
        _id,
        categoryType,
        name,
        active,
        createdAt,
        modifiedAt,
        qrs,
    }: CategoryDocument): CategoryResponseDTO =>
        new CategoryResponseDTO(
            _id.toHexString(),
            categoryType,
            name,
            active,
            createdAt,
            modifiedAt,
            qrs)

}