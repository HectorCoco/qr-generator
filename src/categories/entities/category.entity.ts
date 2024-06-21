import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Category extends Document {

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
    createdAt: number

    @Prop({
        index: true,
    })
    modifiedAt?: number


}

export const CategorySchema = SchemaFactory.createForClass(Category)
