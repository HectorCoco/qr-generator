import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { QrDocument } from '../../qrs/entities/qr.entity';

export type LocationDocument = Location & Document<Types.ObjectId>

@Schema({ collection: 'locations' })

export class Location extends Document {

    @Prop({
        type: Number,
        unique: false,
        // index: true,
        default: true,
    })
    @IsNumber()
    locationNumber: number

    @Prop({
        type: String,
        unique: false,
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
        default: new Date().toISOString().split('T')[0]
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


export const LocationSchema = SchemaFactory.createForClass(Location)
