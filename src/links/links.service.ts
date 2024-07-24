import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinkDocument } from './entities/link.entity';
import { Model, Types, isValidObjectId } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { validateOrReject, IsMongoId } from 'class-validator';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
import LinkResponseDTO from './dto/link-response.dto';

@Injectable()
export class LinksService {

  constructor(
    @InjectModel('Link')
    private readonly linkModel: Model<LinkDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>,
  ) { }

  // ------------------------------------------------------
  async create(createLinkDto: CreateLinkDto) {

    await validateOrReject(createLinkDto)


    try {
      const newLink = await this.linkModel.create(createLinkDto)
      newLink.name = createLinkDto.name.toLocaleLowerCase()
      const _idQr = new Types.ObjectId(createLinkDto.qr)
      const qr = await this.qrModel.findById(_idQr).exec()

      newLink.qr = qr

      const link = await newLink.save()

      return LinkResponseDTO.from(link)
    }
    catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  // ------------------------------------------------------
  async findAll() {

    return await this.linkModel.find()
  }

  // ------------------------------------------------------
  async findLinksWithFilters(
    qr?: string,
  ): Promise<Array<LinkResponseDTO>> {

    try {
      let query = this.linkModel.find();

      if (!qr) {

        const links = await query.populate('qr').exec()

        return links.map(LinkResponseDTO.from)
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
      const links = await query.populate('qr').exec()

      return links.map(LinkResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  // ------------------------------------------------------
  async findOne(term: string): Promise<LinkDocument> {

    const isMongoId = Types.ObjectId.isValid(term)

    let link: LinkDocument | null


    if (isMongoId) {
      link = await this.linkModel.findById(term)
        .populate('qr')
        .exec()

    } else {
      link = await this.linkModel.findOne({ name: term })
        .populate('qr')
        .exec()
    }

    if (!link) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return link
  }

  // ------------------------------------------------------
  async update(term: string, updateLinkDto: UpdateLinkDto): Promise<LinkResponseDTO> {

    const link = await this.findOne(term)

    if (!link) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    updateLinkDto.modifiedAt = new Date().toISOString().split('T')[0].toString()

    if (updateLinkDto.name) {
      updateLinkDto.name = updateLinkDto.name.toLowerCase()
    }

    if (updateLinkDto.linkReference) {
      updateLinkDto.linkReference = updateLinkDto.linkReference
    }

    if (updateLinkDto.qr) {

      const _idQr = new Types.ObjectId(updateLinkDto.qr)
      const qr = await this.qrModel.findById(_idQr).exec()

      link.qr = qr
    }

    try {
      // Usar `set` para actualizar solo los campos que han cambiado
      Object.keys(updateLinkDto).forEach((key) => {
        if (key !== '_id' && key !== 'qr') {
          link.set(key, updateLinkDto[key]);
        }
      })

      const updatedLink = await link.save()

      return LinkResponseDTO.from(updatedLink)

    }
    catch (error) {
      console.log(error)
      handleExceptions(error)
    }

  }
  
  // -------------------------------------------------------
  async remove(id: string) {
    const { deletedCount, acknowledged } = await this.linkModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }

    return { "msg": "Registro eliminado exitosamente" }

  }

}
