import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import { IsString, IsBoolean, IsObject } from 'class-validator';
import { Document, Types } from "mongoose";
import { LocationDocument } from "src/locations/entities/location.entity";

export type QrDocument = Qr & Document<Types.ObjectId>

@Schema({ collection: 'qrs' })

export class Qr extends Document {
    @Prop({
        type: String,
        unique: true,
        // index: true
    })
    @IsString()
    name: string

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
    createdAt: string;

    @Prop({
        required: false,
        type: String,
        default: "",
    })
    @IsString()
    modifiedAt?: string;

    @Prop({
        // required: true,
        type: Types.ObjectId,
        ref: 'Location'
    })
    @IsObject()
    location?: LocationDocument;

    // @Prop({
    //     type: [{
    //         type: Types.ObjectId,
    //         ref: Location.name
    //     }],
    //     ref: "Location",
    //     unique: false,
    //     required: true,
    //     sparse: true
    // })
    // location: Location

}

export const QrSchema = SchemaFactory.createForClass(Qr)
