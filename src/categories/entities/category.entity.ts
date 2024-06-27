import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { IsBoolean, IsString } from "class-validator";
import { QrDocument } from "src/qrs/entities/qr.entity";

export type CategoryDocument = Category & Document<Types.ObjectId>

@Schema({ collection: 'categories' })

export class Category extends Document {

    @Prop({
        type: String,
        unique: true,
        // index: true,
        default: true,
    })
    @IsString()
    categoryType: string

    @Prop({
        type: String,
        unique: true,
        // index: true,
    })
    @IsString()
    name: string


    @Prop({
        type: Boolean,
        // index: true,
        default: true,
    })
    @IsBoolean()
    active: boolean

    @Prop({
        type: String,
        // index: true,
        default: new Date().toISOString().split('T')[0]
    })
    @IsString()
    createdAt: string

    @Prop({
        type: String,
        // index: true,
        default: "",
    })
    @IsString()
    modifiedAt?: string

    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'Qr'
        }]
    })
    qrs: Array<QrDocument>

}

export const CategorySchema = SchemaFactory.createForClass(Category)
