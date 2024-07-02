import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { InjectModel } from '@nestjs/mongoose';
import { FileDocument } from 'src/files/entities/file.entity';
import { Model, Types } from 'mongoose';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import DocumentResponseDTO from './dto/document-response.dto';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
import { validateOrReject } from 'class-validator';

@Injectable()
export class FilesService {

  constructor(
    @InjectModel('File')
    private readonly fileModel: Model<FileDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>
  ) { }

  async create(createDocumentDto: CreateDocumentDto): Promise<DocumentResponseDTO> {

    await validateOrReject(createDocumentDto)


    try {
      const newDocument = new this.fileModel(createDocumentDto)
      newDocument.name = createDocumentDto.name.toLocaleLowerCase()
      newDocument.documentReference = createDocumentDto.documetReference
      const _idQr = new Types.ObjectId(createDocumentDto.qr)
      const qr = await this.qrModel.findById(_idQr).exec()
      newDocument.qr = qr

      const document = await newDocument.save()

      return DocumentResponseDTO.from(document)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async findAll() {

    return await this.fileModel.find()
  }

  async findDocumentsWithFilters(
    qr?: string,
  ): Promise<Array<DocumentResponseDTO>> {

    try {
      let query = this.fileModel.find();

      if (!qr) {

        const document = await query.populate('qr').exec()

        return document.map(DocumentResponseDTO.from)
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
      const document = await query.populate('qr').exec()

      return document.map(DocumentResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }


  async findOne(term: string): Promise<FileDocument> {

    const isMongoId = Types.ObjectId.isValid(term)

    let document: FileDocument | null

    if (isMongoId) {
      document = await this.fileModel.findById(term)
        .populate('qr')
        .exec()

    } else {
      document = await this.fileModel.findOne({ name: term })
        .populate('qr')
        .exec()
    }

    if (!document) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return document

  }

  async update(term: string, updateDocumentDto: UpdateDocumentDto): Promise<DocumentResponseDTO> {


    const document = await this.findOne(term)

    if (!document) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    updateDocumentDto.modifiedAt = new Date().toISOString().split('T')[0].toString()

    if (updateDocumentDto.name) {
      updateDocumentDto.name = updateDocumentDto.name.toLowerCase()
    }

    if (updateDocumentDto.qr) {

      const _idQr = new Types.ObjectId(updateDocumentDto.qr)
      const qr = await this.qrModel.findById(_idQr).exec()

      document.qr = qr

    }

    try {

      // Usar `set` para actualizar solo los campos que han cambiado
      Object.keys(updateDocumentDto).forEach((key) => {
        if (key !== '_id' && key !== 'qr') {
          document.set(key, updateDocumentDto[key]);
        }
      })

      const updatedDocument = await document.save()

      return DocumentResponseDTO.from(updatedDocument)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.fileModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }
    return { "msg": "Registro eliminado exitosamente" }
  }

}
