import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsObject, IsString } from "class-validator";
import { Document, Types } from "mongoose";
import { QrDocument } from "src/qrs/entities/qr.entity";


export type LinkDocument = Link & Document<Types.ObjectId>

@Schema({ collection: 'links' })
export class Link extends Document {

    @Prop({
        type: String,
        unique: true,
        required: false,
    })
    @IsString()
    name?: string

    @Prop({
        unique: false,
        required: true
    })
    @IsString()
    url: string

    @Prop({
        default: true,
        type: Boolean
    })
    @IsBoolean()
    active: boolean

    @Prop({
        required: true,
        type: String,
        default: new Date().toISOString().split('T')[0]
    })
    @IsString()
    createdAt: string

    @Prop({
        required: false,
        type: String,
        default: "",
    })
    @IsString()
    modifiedAt?: string

    @Prop({
        // required: true,
        type: Types.ObjectId,
        ref: 'Qr'
    })
    @IsObject()
    qr?: QrDocument;
}

export const LinkSchema = SchemaFactory.createForClass(Link)
