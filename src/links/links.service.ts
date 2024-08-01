import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinkDocument } from './entities/link.entity';
import mongoose, { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { validateOrReject } from 'class-validator';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
import LinkResponseDTO from './dto/link-response.dto';

@Injectable()
export class LinksService {
  constructor(
    @InjectModel('Link') private readonly linkModel: Model<LinkDocument>, // Inyectar el modelo de Link
    @InjectModel('Qr') private readonly qrModel: Model<QrDocument>, // Inyectar el modelo de Qr
  ) { }




  /**
   * Método para crear un nuevo enlace.
   * @param createLinkDto - Datos para crear el enlace.
   * @returns El enlace creado en formato DTO.
   */
  async create(createLinkDto: CreateLinkDto): Promise<LinkResponseDTO> {
    await validateOrReject(createLinkDto); // Validar el DTO

    try {
      const newLink = new this.linkModel(createLinkDto); // Crear una nueva instancia del modelo Link
      newLink.name = createLinkDto.name.toLowerCase(); // Convertir el nombre a minúsculas

      const _idQr = new Types.ObjectId(createLinkDto.qr); // Convertir el ID de QR a ObjectId
      const qr = await this.qrModel.findById(_idQr).exec(); // Buscar el QR por ID
      newLink.qr = qr; // Asignar el QR encontrado al nuevo enlace

      const link = await newLink.save(); // Guardar el nuevo enlace en la base de datos
      return LinkResponseDTO.from(link); // Retornar el enlace en formato DTO
    } catch (error) {
      console.log(error);
      handleExceptions(error); // Manejar excepciones
    }
  }

  /** 
   * The `createLink` function in TypeScript creates a link using data from a QrDocument object.
   * @param {QrDocument} qr - The `qr` parameter in the `createLink` function is of type `QrDocument`,
   * which seems to have properties `name`, `qrUrl`, and `_id`. The function extracts these properties
   * from the `qr` object and creates a `createLinkDto` object with properties `name
   */
  async createLink(qr: QrDocument) {
    const { name, qrUrl, _id } = qr;
    try {
      const createLinkDto: CreateLinkDto = {
        name: name,
        url: qrUrl,
        qr: _id.toString(),
      }

      await this.create(createLinkDto)

    } catch (error) {
      throw new InternalServerErrorException('Error al crear el registro de link', error);
    }

  }

  /**
   * Método para obtener todos los enlaces.
   * @returns Todos los enlaces encontrados.
   */
  async findAll(): Promise<LinkDocument[]> {
    try {
      return await this.linkModel.find().populate({
        path: 'qr',
        select: '_id name',
      }).exec(); // Retornar todos los enlaces con su QR relacionado

    } catch (error) {
      console.log(error);
      handleExceptions(error); // Manejar excepciones
    }
  }

  /**
 * Método para encontrar un enlace por término.
 * @param term - Término de búsqueda (ID o nombre).
 * @returns El enlace encontrado.
 */
  async findOne(term: string): Promise<LinkDocument> {
    const isMongoId = Types.ObjectId.isValid(term); // Verificar si el término es un ID válido
    let link: LinkDocument | null;

    if (isMongoId) {
      link = await this.linkModel.findById(term).populate({
        path: 'qr',
        select: '_id name',
      }).exec(); // Buscar por ID
    } else {
      link = await this.linkModel.findOne({ name: term }).populate({
        path: 'qr',
        select: '_id name',
      }).exec(); // Buscar por nombre
    }

    if (!link) {
      throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`); // Lanzar excepción si no se encuentra
    }

    return link;
  }

  /**
   * Método para encontrar enlaces con filtros.
   * @param qr - Filtro opcional por nombre de QR.
   * @returns Lista de enlaces que coinciden con los filtros.
   */
  async findLinksWithFilters(qr?: string): Promise<Array<LinkResponseDTO>> {
    try {
      let query = this.linkModel.find(); // Iniciar la consulta

      if (!qr) {
        const links = await query.populate({
          path: 'qr',
          select: '_id name',
        }).exec();
        return links.map(LinkResponseDTO.from); // Si no hay filtro, retornar todos los enlaces
      }

      if (qr) {
        const qrs = await this.qrModel
          .find({ name: { $regex: new RegExp(qr, 'i') } }) // Buscar coincidencias parciales en 'name'
          .select('_id')
          .exec();

        if (qrs.length > 0) {
          query = query.where('qr').in(qrs.map(_qr => _qr._id)); // Ajustar la consulta para buscar enlaces con QR coincidentes
        } else {
          return []; // Si no hay coincidencias para 'qr', devolver un array vacío
        }
      }

      const links = await query
        .populate({
          path: 'qr',
          select: '_id name',
        }).exec(); // Ejecutar la consulta con los filtros
      return links.map(LinkResponseDTO.from); // Retornar los enlaces encontrados en formato DTO
    } catch (error) {
      console.log(error);
      handleExceptions(error); // Manejar excepciones
    }
  }

  /**
   * Método para actualizar un enlace.
   * @param term - Término de búsqueda (ID o nombre).
   * @param updateLinkDto - Datos para actualizar el enlace.
   * @returns El enlace actualizado en formato DTO.
   */
  async update(term: string, updateLinkDto: UpdateLinkDto): Promise<LinkResponseDTO> {

    const link = await this.findOne(term); // Buscar el enlace existente

    if (!link) {
      throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`); // Lanzar excepción si no se encuentra
    }


    if (updateLinkDto.name) {
      updateLinkDto.name = updateLinkDto.name.toLowerCase(); // Convertir nombre a minúsculas
    }

    if (updateLinkDto.qr) {
      const _idQr = new Types.ObjectId(updateLinkDto.qr); // Convertir el ID de QR a ObjectId
      const qr = await this.qrModel.findById(_idQr).exec();
      link.qr = qr; // Actualizar QR asociado
    }

    updateLinkDto.modifiedAt = new Date().toISOString().split('T')[0]; // Actualizar fecha de modificación

    try {
      // Usar `set` para actualizar solo los campos que han cambiado
      Object.keys(updateLinkDto).forEach((key) => {
        if (key !== '_id' && key !== 'qr') {
          link.set(key, updateLinkDto[key]);
        }
      });

      const updatedLink = await link.save(); // Guardar cambios en la base de datos

      return LinkResponseDTO.from(updatedLink); // Retornar enlace actualizado en formato DTO
    } catch (error) {
      console.log(error);
      handleExceptions(error); // Manejar excepciones
    }
  }

  /**
   * Método para eliminar un enlace.
   * @param id - ID del enlace a eliminar.
   * @returns Mensaje de éxito.
   */
  async remove(id: string): Promise<{ msg: string }> {
    const { deletedCount } = await this.linkModel.deleteOne({ _id: id }).exec(); // Eliminar el enlace por ID

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`); // Lanzar excepción si no se encuentra
    }

    return { msg: "Registro eliminado exitosamente" }; // Retornar mensaje de éxito
  }

  /**
  * Finds and deletes a Link document by its associated QR ID.
  * @param qrId - The ID of the QR document to find and delete the associated Link.
  * @returns A promise that resolves to a success message.
  * @throws Will throw an error if the query fails.
  */
  async removeByQrId(qrId: string): Promise<{ msg: string }> {

    console.log("Entro a removeByQrId");

    // Asegúrate de que qrId esté en el formato correcto
    const objectId = mongoose.Types.ObjectId.isValid(qrId) ? new mongoose.Types.ObjectId(qrId) : null;
    if (!objectId) {
      console.log("ID de QR no es válido");
      throw new NotFoundException(`ID de QR no es válido: ${qrId}`);
    }

    // Verificar los documentos antes de eliminar
    const linksBefore = await this.linkModel.find({ qr: objectId }).exec();
    console.log("Links antes de eliminar:", linksBefore);

    const result = await this.linkModel.deleteMany({ qr: objectId }).exec();

    if (result.deletedCount === 0) {
      console.log("No se elimino registro de link");
      throw new NotFoundException(`No se encontraron enlaces asociados al QR con id ${qrId}`);
    }

    console.log(`Se eliminaron ${result.deletedCount} enlaces asociados al QR con id ${qrId}`);

    // Verificar los documentos después de eliminar
    const linksAfter = await this.linkModel.find({ qr: objectId }).exec();
    console.log("Links después de eliminar:", linksAfter);

    return { msg: "registro eliminado exitosamente" };
  }

}
