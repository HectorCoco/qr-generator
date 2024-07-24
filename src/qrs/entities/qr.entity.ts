import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { IsString, IsBoolean, IsObject } from 'class-validator';
import { LocationDocument } from "src/locations/entities/location.entity";
import { CategoryDocument } from "src/categories/entities/category.entity";
import { ImageDocument } from "src/images/entities/image.entity";

export type QrDocument = Qr & Document<Types.ObjectId>

@Schema({ collection: 'qrs' })

export class Qr extends Document {
    @Prop({
        type: String,
        unique: true,
        index: true
    })
    @IsString()
    name: string

    @Prop({
        required: true,
        type: String,
    })
    @IsString()
    qrUrl: string

    @Prop({
        type: Boolean,
        default: true,

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
        ref: 'Location'
    })
    @IsObject()
    location?: LocationDocument

    @Prop({
        // required: true,
        type: Types.ObjectId,
        ref: 'Category'
    })
    @IsObject()
    category?: CategoryDocument


    @Prop({
        type: Types.ObjectId,
        ref: 'Image'
    })
    @IsObject()
    image: ImageDocument

    @Prop({
        type: Array<any>
    })
    @IsObject()
    qrData?: Array<any>
}

export const QrSchema = SchemaFactory.createForClass(Qr)
