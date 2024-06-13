import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document as DocumentDocument } from "mongoose";

@Schema()
export class Document extends DocumentDocument {

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

export const DocumentSchema = SchemaFactory.createForClass(Document)