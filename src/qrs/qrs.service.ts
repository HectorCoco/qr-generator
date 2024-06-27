import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { validateOrReject } from 'class-validator';
import QrResponseDTO from './dto/qr-response.dto';
import { CreateQrDto } from './dto/create-qr.dto';
import { QrDocument } from './entities/qr.entity';
import { UpdateQrDto } from './dto/update-qr.dto';
import { LocationDocument } from '../locations/entities/location.entity';
import { CategoryDocument } from 'src/categories/entities/category.entity';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';


@Injectable()
export class QrsService {

  constructor(
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>,
    @InjectModel('Location')
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Category')
    private readonly categoryModel: Model<CategoryDocument>,
  ) { }

  async create(createQrDto: CreateQrDto): Promise<QrResponseDTO> {

    await validateOrReject(createQrDto)

    createQrDto.name = createQrDto.name.toLocaleLowerCase()

    try {

      const newQr = new this.qrModel(createQrDto)
      const _idLocation = new Types.ObjectId(createQrDto.location)
      const _idCategory = new Types.ObjectId(createQrDto.category)
      const location = await this.locationModel.findById(_idLocation).exec()
      const category = await this.categoryModel.findById(_idCategory).exec()
      newQr.location = location
      newQr.category = category
      const qr = await newQr.save()

      return QrResponseDTO.from(qr)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findAll() {

    return await this.qrModel.find()
  }

  async findQrsWithFilters(
    location?: string,
    category?: string
  ): Promise<Array<QrResponseDTO>> {

    try {
      let query = this.qrModel.find();

      if (!location && !category) {

        return []
      }

      if (location) {
        const locations = await this.locationModel
          .find({ name: { $regex: new RegExp(location, 'i') } })
          .select('_id')
          .exec()

        if (locations.length > 0) {
          query = query.where('location').in(locations.map((loc) => loc._id))
        } else {

          // Si no hay coincidencias para location, devuelve un array vacío
          return []
        }
      }

      if (category) {
        const categories = await this.categoryModel
          .find({ name: { $regex: new RegExp(category, 'i') } })
          .select('_id')
          .exec()

        if (categories.length > 0) {
          query = query.where('category').in(categories.map((cat) => cat._id))
        } else {

          // Si no hay coincidencias para category, devuelve un array vacío
          return []
        }
      }

      const qrs = await query.populate('location').populate('category').exec()

      return qrs.map(QrResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findOne(term: string): Promise<QrDocument> {

    const isMongoId = Types.ObjectId.isValid(term)
    let qr: QrDocument | null

    if (isMongoId) {
      qr = await this.qrModel.findById(term)
        .populate('location')
        .populate('category')
        .exec()

    } else {
      qr = await this.qrModel.findOne({ name: term })
        .populate('location')
        .populate('category')
        .exec()
    }

    if (!qr) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return qr
  }

  async search(term: string): Promise<QrDocument[]> {

    const qrs = await this.qrModel
      .find({ name: { $regex: '.*' + term + '.*', $options: 'i' } })
      .populate('location')
      .populate('category')
      .limit(20)
      .exec()

    if (!qrs.length) throw new NotFoundException(`Su búsqueda no arrojó ningún resultado`)

    return qrs
  }

  async update(term: string, updateQrDto: UpdateQrDto): Promise<QrResponseDTO> {

    const qr = await this.findOne(term)

    if (!qr) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    updateQrDto.modifiedAt = new Date().toISOString().split('T')[0].toString()

    if (updateQrDto.name) {
      updateQrDto.name = updateQrDto.name.toLowerCase()
    }

    if (updateQrDto.location) {

      const _idLoc = new Types.ObjectId(updateQrDto.location)
      const location = await this.locationModel.findById(_idLoc).exec()

      if (location) {
        qr.location = location
      }
    }

    if (updateQrDto.category) {

      const _idCat = new Types.ObjectId(updateQrDto.category)
      const category = await this.categoryModel.findById(_idCat).exec()

      if (category) {
        qr.category = category
      }

    }

    try {
      Object.assign(qr, updateQrDto)
      const updatedQr = await qr.save()

      return QrResponseDTO.from(qr)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.qrModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Locación eliminada exitosamente" }

  }

}
