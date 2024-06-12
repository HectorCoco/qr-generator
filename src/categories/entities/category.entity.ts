import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema()
export class Category {

    @Prop({
        unique: true,
        index: true,
        default: true,
    })
    category_number: number

    @Prop({
        unique: true,
        index: true,
    })
    name: string


    @Prop({
        index: true,
        default: true,
    })
    active: boolean

    @Prop({
        index: true,
        default: new Date().getTime(),
    })
    created_at: number

    @Prop({
        index: true,
    })
    modified_at?: number


}

export const CategorySchema = SchemaFactory.createForClass(Category)
