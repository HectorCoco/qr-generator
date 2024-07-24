import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsNumber, IsObject, IsString } from "class-validator";
import { Document, Types } from "mongoose";
import { QrDocument } from "src/qrs/entities/qr.entity";


export type ImageDocument = Image & Document<Types.ObjectId>

@Schema({ collection: 'images' })
export class Image extends Document {

    @Prop({
        type: String,
        unique: true,
        required: false,
    })
    @IsString()
    name?: string

    @Prop({
        type: String,
        unique: false,
        required: false,
    })
    @IsString()
    imageReference?: string

    @Prop({
        type: Number,
        unique: false,
    })
    @IsNumber()
    order: number

    @Prop({
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

    @Prop({
        type: String,
        unique: false,
        required: false,
    })
    @IsString()
    s3Reference?: string;
}


export const ImageSchema = SchemaFactory.createForClass(Image)
