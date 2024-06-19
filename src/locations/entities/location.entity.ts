import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, ObjectId, Types } from "mongoose";
import { IsBoolean, IsNumber, IsString } from "class-validator";
import { QrDocument } from '../../qrs/entities/qr.entity';

export type LocationDocument = Location & Document<Types.ObjectId>

@Schema({ collection: 'locations' })

export class Location extends Document {

    @Prop({
        unique: false,
        index: true,
        default: true,
    })
    @IsNumber()
    location_number: number

    @Prop({
        unique: false,
        index: true,
    })
    @IsString()
    name: string


    @Prop({
        index: true,
        default: true,
    })
    @IsBoolean()
    active: boolean

    @Prop({
        index: true,
        default: new Date().getTime(),
    })
    @IsNumber()
    created_at: number

    @Prop({
        index: true,
    })
    @IsNumber()
    modified_at?: number


    @Prop({
        type: [{
            type: Types.ObjectId,
            ref: 'Qr'
        }]
    })
    qrs: Array<QrDocument>
}


export const LocationSchema = SchemaFactory.createForClass(Location)
