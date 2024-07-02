import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { Image, ImageDocument } from './entities/image.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { validateOrReject } from 'class-validator';
import ImageResponseDTO from './dto/image-response.dto';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';

@Injectable()
export class ImagesService {

  constructor(
    @InjectModel('Image')
    private readonly imageModel: Model<ImageDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>,
  ) { }

  async create(createImageDto: CreateImageDto): Promise<ImageResponseDTO> {

    await validateOrReject(createImageDto)

    createImageDto.name = createImageDto.name.toLocaleLowerCase()

    try {
      const newImage = await this.imageModel.create(createImageDto)
      const _idQr = new Types.ObjectId(createImageDto.qr)
      const qr = await this.qrModel.findById(_idQr).exec()
      newImage.qr = qr

      const image = await newImage.save()

      return ImageResponseDTO.from(image)
    }

    catch (error) {
      console.log(error)
      handleExceptions(error)
    }

  }

  async findAll() {

    return await this.imageModel.find()
  }

  async findImagesWithFilters(
    qr?: string,
  ): Promise<Array<ImageResponseDTO>> {

    try {
      let query = this.imageModel.find();

      if (!qr) {

        const images = await query.populate('qr').exec()

        return images.map(ImageResponseDTO.from)
      }

      if (qr) {

        const qrs = await this.qrModel
          .find({ name: { $regex: new RegExp(qr, 'i') } })  // Buscar coincidencias parciales en 'name'
          .select('_id')
          .exec();

        if (qrs.length > 0) {
          // Ajustar la consulta para buscar imágenes que tengan uno de los 'qr' encontrados
          query = query.where('qr').in(qrs.map((_qr) => _qr._id));
        } else {
          return []; // Si no hay coincidencias para 'qr', devolver un array vacío
        }

      }
      const images = await query.populate('qr').exec()

      return images.map(ImageResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findOne(term: string): Promise<ImageDocument> {

    const isMongoId = Types.ObjectId.isValid(term)

    let image: ImageDocument | null

    if (isMongoId) {
      image = await this.imageModel.findById(term)
        .populate('qr')
        .exec()

    } else {
      image = await this.imageModel.findOne({ name: term })
        .populate('qr')
        .exec()
    }

    if (!image) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return image
  }

  async update(term: string, updateImageDto: UpdateImageDto): Promise<ImageResponseDTO> {

    const image = await this.findOne(term)

    if (!image) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    updateImageDto.modifiedAt = new Date().toISOString().split('T')[0].toString()

    if (updateImageDto.name) {
      updateImageDto.name = updateImageDto.name.toLowerCase()
    }

    if (updateImageDto.qr) {

      const _idQr = new Types.ObjectId(updateImageDto.qr)
      const qr = await this.qrModel.findById(_idQr).exec()

      image.qr = qr
    }

    try {
      // Usar `set` para actualizar solo los campos que han cambiado
      Object.keys(updateImageDto).forEach((key) => {
        if (key !== '_id' && key !== 'qr') {
          image.set(key, updateImageDto[key]);
        }
      })

      const updatedImage = await image.save()

      return ImageResponseDTO.from(updatedImage)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }


  async remove(id: string) {
    const { deletedCount, acknowledged } = await this.imageModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Registro eliminado exitosamente" }

  }

}
