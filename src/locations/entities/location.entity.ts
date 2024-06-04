import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema()
export class Location extends Document {

    // id: string generado por mongo

    @Prop({
        unique: true,
        index: true,
        default: true,
    })
    location_number: number
    
    @Prop({
        unique: true,
        index: true,
    })
    name: string


    @Prop({
        index: true,
        default: true,
    })
    active: boolean

    @Prop({
        index: true,
    })
    created_at: number

    @Prop({
        index: true,
    })
    modified_at?: number

}







export const LocationSchema = SchemaFactory.createForClass(Location)
