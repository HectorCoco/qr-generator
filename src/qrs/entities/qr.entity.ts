import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Type } from "class-transformer";
import mongoose, { Document, Types } from "mongoose";
import { Location, LocationDocument, LocationSchema } from "src/locations/entities/location.entity";

export type QrDocument = Qr & Document<Types.ObjectId>

@Schema({ collection: 'qrs' })

export class Qr extends Document {
    @Prop({})
    name: string

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
    @Prop({
        required: true,
        type: Types.ObjectId,
        ref: 'Location'
    })
    location: LocationDocument;

}

export const QrSchema = SchemaFactory.createForClass(Qr)
