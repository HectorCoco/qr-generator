import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { IsBoolean, IsObject, IsString } from "class-validator";
import { QrDocument } from "src/qrs/entities/qr.entity";


export type FileDocument = File & Document<Types.ObjectId>

@Schema({ collection: 'files' })
export class File extends Document {

    @Prop({
        required: true,
        unique: false,
    })
    @IsString()
    name: string

    @Prop({
        type: String,
        unique: false,
        required: false,
    })
    @IsString()
    s3Reference: string

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
}


export const FileSchema = SchemaFactory.createForClass(File)