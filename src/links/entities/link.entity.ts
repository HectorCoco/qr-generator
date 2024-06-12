import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Link extends Document {

    @Prop({
        unique: true,
        index: true,
    })
    name: string

    @Prop({
        unique: true,
        index: true
    })
    value: string
}

export const LinkSchema = SchemaFactory.createForClass(Link)
