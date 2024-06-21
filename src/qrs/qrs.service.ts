import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { CreateQrDto } from './dto/create-qr.dto';
import { QrDocument } from './entities/qr.entity';
import { UpdateQrDto } from './dto/update-qr.dto';
import { LocationDocument } from '../locations/entities/location.entity';
import QrResponseDTO from './dto/qr.response.dto';
import { validateOrReject } from 'class-validator';

@Injectable()
export class QrsService {

  constructor(
    @InjectModel('Location')
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>
  ) { }

  // TODO Revisar el uso de any aca!!!!!!!!!!!!!!
  async findQrsAndLocation(location: string): Promise<Array<any>> {
    try {
      let query = this.qrModel.find();
      if (location) {
        const locations = await this.locationModel
          .find()
          .where('name')
          .regex(new RegExp(location, 'i'))
          .select('id')
          .exec();
        console.log("locations ", locations);
        query = query.where('location').in(locations.map((loc) => loc._id));
      }
      const qrs = await query.populate('location').exec();
      console.log("qrs", qrs);
      return qrs;
    } catch (error) {
      console.log(error);
      this.handleExceptions(error)
    }
  }

  async create(createQrDto: CreateQrDto): Promise<QrResponseDTO> {

    await validateOrReject(createQrDto);

    createQrDto.name = createQrDto.name.toLocaleLowerCase()

    try {

      const newQr = new this.qrModel(createQrDto);
      console.log(newQr)
      const _id = new Types.ObjectId(createQrDto.location);
      const location = await this.locationModel.findById(_id).exec();
      // console.log(location);
      newQr.location = location;
      // newQr.creationDate = new Date().toISOString().slice(0, 10);
      const qr = await newQr.save();

      return QrResponseDTO.from(qr);

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async findAll() {
    return await this.qrModel.find()
  }

  async findOne(term: string) {

    let qr: QrDocument

    // if (!isNaN(+term)) {
    //   qr = await this.qrModel.findOne({ location: term })
    // }
    // MongoID
    if (!qr && isValidObjectId(term)) {
      qr = await this.qrModel.findById(term)
    }
    // Name
    if (!qr) {
      qr = await this.qrModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!qr) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

    return qr

  }

  async update(term: string, updateQrDto: UpdateQrDto) {

    const qr = await this.findOne(term)

    if (updateQrDto.name) {
      updateQrDto.name = updateQrDto.name.toLowerCase()
    }

    try {
      await qr.updateOne(updateQrDto)
      return { ...qr.toJSON(), ...updateQrDto }

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
    // return ({ location, updateLocationDto })
  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.qrModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Locación eliminada exitosamente" }

  }

  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Ya existe registro en la base de datos ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`No se puede crear el registro, favor de checar en consola`)

  }


}
