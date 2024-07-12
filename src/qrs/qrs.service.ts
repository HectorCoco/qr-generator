import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { validateOrReject } from 'class-validator';
import { CreateQrDto } from './dto/create-qr.dto';
import { QrDocument } from './entities/qr.entity';
import { UpdateQrDto } from './dto/update-qr.dto';
import QrResponseDTO from './dto/qr-response.dto';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
import { generateSlug } from 'src/common/helpers/strings.helpers';
import { LocationDocument } from '../locations/entities/location.entity';
import { CategoryDocument } from 'src/categories/entities/category.entity';
import { ImageDocument } from 'src/images/entities/image.entity';
import { FileDocument } from 'src/files/entities/file.entity';
import { LinkDocument } from 'src/links/entities/link.entity';


@Injectable()
export class QrsService {

  constructor(
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>,
    @InjectModel('Location')
    private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Category')
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel('Image')
    private readonly imageModel: Model<ImageDocument>,
    @InjectModel('File')
    private readonly fileModel: Model<FileDocument>,
    @InjectModel('Link')
    private readonly linkModel: Model<LinkDocument>,
  ) { }

  // ----------------------------------------
  async create(createQrDto: CreateQrDto): Promise<QrResponseDTO> {

    await validateOrReject(createQrDto)

    try {

      const newQr = new this.qrModel(createQrDto)

      newQr.name = createQrDto.name.toLocaleLowerCase()

      newQr.qrUrl = generateSlug(12)

      const _idLocation = new Types.ObjectId(createQrDto.location)
      const location = await this.locationModel.findById(_idLocation).exec()
      newQr.location = location

      const _idCategory = new Types.ObjectId(createQrDto.category)
      const category = await this.categoryModel.findById(_idCategory).exec()
      newQr.category = category

      const qr = await newQr.save()

      return QrResponseDTO.from(qr)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  //Sustituido en el controlador por el metodo findQrsWithFilters
  async findAll() {

    return await this.qrModel.find()
  }

  // ----------------------------------------
  async findOne(term: string): Promise<any> {

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


    const qrId = qr.id
    const qrCategory = qr.category.categoryType
    const results = await this.getDataType(qrId, qrCategory)
    const qrDto = QrResponseDTO.from(qr)


    qrDto.qrData.push(results)


    return qrDto
  }

  // ----------------------------------------
  async update(term: string, updateQrDto: UpdateQrDto): Promise<QrResponseDTO> {

    const qr = await this.findOne(term);

    if (!qr) {
      throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`);
    }

    updateQrDto.modifiedAt = new Date().toISOString().split('T')[0].toString();

    if (updateQrDto.name) {
      updateQrDto.name = updateQrDto.name.toLowerCase();
    }

    if (updateQrDto.location) {
      const _idLocation = new Types.ObjectId(updateQrDto.location)
      const location = await this.locationModel.findById(_idLocation).exec()

      qr.location = location
    }

    if (updateQrDto.category) {
      const _idCategory = new Types.ObjectId(updateQrDto.category)
      const category = await this.categoryModel.findById(_idCategory).exec()

      qr.category = category
    }

    try {
      Object.keys(updateQrDto).forEach((key) => {
        if (key !== '_id' && key !== 'location' && key !== 'category') {
          qr.set(key, updateQrDto[key]);
        }
      });

      const updatedQr = await qr.save();

      return QrResponseDTO.from(updatedQr);

    } catch (error) {
      console.log(error);
      handleExceptions(error);
    }
  }

  // ----------------------------------------
  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.qrModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Locación eliminada exitosamente" }

  }

  // ----------------------------------------
  async search(term: string): Promise<Array<QrDocument>> {

    const qrs = await this.qrModel
      .find({ name: { $regex: '.*' + term + '.*', $options: 'i' } })
      .populate('location')
      .populate('category')
      .limit(20)
      .exec()

    if (!qrs.length) throw new NotFoundException(`Su búsqueda no arrojó ningún resultado`)

    return qrs
  }
  // ----------------------------------------
  async findQrsWithFilters(
    location?: string,
    category?: string
  ): Promise<Array<QrResponseDTO>> {
    try {
      let query = this.qrModel.find();

      if (location) {
        const locations = await this.locationModel
          .find({ name: { $regex: new RegExp(location, 'i') } })
          .select('_id')
          .exec()

        if (locations.length > 0) {
          query = query.where('location').in(locations.map((loc) => loc._id));
        } else {
          return []
        }
      }

      if (category) {
        const categories = await this.categoryModel
          .find({ name: { $regex: new RegExp(category, 'i') } })
          .select('_id')
          .exec()

        if (categories.length > 0) {
          query = query.where('category').in(categories.map((cat) => cat._id));
        } else {
          return []
        }
      }

      const qrs = await query
        .populate('location')
        .populate('category')
        .exec()

      const qrPromises = qrs.map(async qr => {
        const { _id: id, category: { categoryType } } = qr
        const qrDto = QrResponseDTO.from(qr)

        const result = await this.getDataType(id, categoryType)
        qrDto.qrData = result

        return qrDto

      })

      const qrDtos = await Promise.all(qrPromises)

      return qrDtos

    } catch (error) {
      console.log(error);
      handleExceptions(error);
    }
  }

  // ----------------------------------------
  async getDataType(id: Types.ObjectId, categoryType: string) {

    if (categoryType === 'images') {
      const images = await this.imageModel
        .find({ qr: id })
        .sort({ order: 1 })
        .exec()
      return images.map(image => ({ value: image.imageReference, order: image.order }))

    } else if (categoryType === 'documents') {
      const documents = await this.fileModel
        .find({ qr: id })
        .exec()

      return documents.map(document => ({ doc: document.name, value: document.documentReference }))

    } else {

      return {}
    }
  }

  // async uploadFile(file: Express.Multer.File) {
  //   const bucketName = "tickets-bucket-service";
  //   const key = file.originalname;
  //   const fileContent = file.buffer;

  //   return this.s3Service.uploadFileToS3(bucketName, key, fileContent);
  // }

}
