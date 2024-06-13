import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Image extends Document {

    @Prop({
        type: String,
        unique: false,
        index: true,
    })
    name: string

    @Prop({
        type: String,
        unique: false,
        index: true,
    })
    image: string

    @Prop({
        type: Number,
        unique: false,
        index: true,
    })
    order: number

}


export const ImageSchema = SchemaFactory.createForClass(Image)
