import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Document } from './entities/document.entity';
import { Model, isValidObjectId } from 'mongoose';

@Injectable()
export class DocumentsService {

  constructor(
    @InjectModel(Document.name)
    private readonly documentModel: Model<Document>
  ) { }

  async create(createDocumentDto: CreateDocumentDto) {

    createDocumentDto.name = createDocumentDto.name.toLocaleLowerCase()

    try {

      const document = await this.documentModel.create(createDocumentDto)
      return document

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }
  }

  async findAll() {
    return await this.documentModel.find()
  }

  async findOne(term: string) {
    let document: Document;

    // if (!isNaN(+term)) {
    //   link = await this.linkModel.findOne({ link_number: term })
    // }

    // MongoID
    if (!document && isValidObjectId(term)) {
      document = await this.documentModel.findById(term)
    }
    // Name
    if (!document) {
      document = await this.documentModel.findOne({ name: term.toLowerCase().trim() })
    }

    if (!document) throw new NotFoundException(`Su busqueda no arroja ningun resultado`)

    return document
  }

  async update(term: string, updateDocumentDto: UpdateDocumentDto) {

    const document = await this.findOne(term)

    if (updateDocumentDto.name) {
      updateDocumentDto.name = updateDocumentDto.name.toLowerCase()
    }
    // if (updateLinkDto.value) {
    //   updateLinkDto.value = updateLinkDto.value
    // }

    try {
      await document.updateOne(updateDocumentDto)
      return { ...document.toJSON(), ...updateDocumentDto }

    } catch (error) {
      console.log(error)
      this.handleExceptions(error)
    }

  }

  async remove(id: string) {

    const { deletedCount, acknowledged } = await this.documentModel.deleteOne({ _id: id })

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`)
    }
    return { "msg": "Registro eliminado exitosamente" }
  }
  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(`Ya existe registro en la base de datos ${JSON.stringify(error.keyValue)}`)
    }
    throw new InternalServerErrorException(`No se puede crear el registro, favor de checar en consola`)

  }
}
