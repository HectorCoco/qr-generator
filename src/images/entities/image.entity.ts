import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Image extends Document {

    @Prop({
        unique: true,
        index: true,
    })
    name: string

    @Prop({
        unique: true,
        index: true,
    })
    image: string

    @Prop({
        unique: true,
        index: true,
        default: true,
    })
    order: number

}


export const ImageSchema = SchemaFactory.createForClass(Image)
