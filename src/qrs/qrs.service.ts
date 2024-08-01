import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateQrDto } from './dto/create-qr.dto';
import { QrDocument } from './entities/qr.entity';
import { UpdateQrDto } from './dto/update-qr.dto';
import QrResponseDTO from './dto/qr-response.dto';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
import { LocationDocument } from '../locations/entities/location.entity';
import { CategoryDocument } from 'src/categories/entities/category.entity';
import { ImageDocument } from 'src/images/entities/image.entity';
import { FileDocument } from 'src/files/entities/file.entity';
import { LinkDocument } from 'src/links/entities/link.entity';
import { S3Service } from "src/s3/s3.service";
import { ImagesService } from 'src/images/images.service';
import { CreateImageDto } from 'src/images/dto/create-image.dto';
import { generateSlug } from 'src/common/helpers/strings.helpers';
import { validateOrReject } from 'class-validator';
import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { LinksService } from 'src/links/links.service';
import { CreateLinkDto } from 'src/links/dto/create-link.dto';
import { Readable } from 'stream';
import { s3Url } from '../s3-credentials';

@Injectable()
export class QrsService {
  constructor(
    @InjectModel('Qr') private readonly qrModel: Model<QrDocument>,
    @InjectModel('Location') private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Category') private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel('Image') private readonly imageModel: Model<ImageDocument>,
    @InjectModel('File') private readonly fileModel: Model<FileDocument>,
    @InjectModel('Link') private readonly linkModel: Model<LinkDocument>,
    private readonly linkService: LinksService,
    private readonly imagesService: ImagesService,
    private readonly FilesService: LinksService,
    private readonly s3Service: S3Service,
  ) { }

  /** Método para crear un QR */
  async create(createQrDto: CreateQrDto, files?: Express.Multer.File[]): Promise<QrResponseDTO> {
    // Validar el DTO usando la función validateOrReject
    await validateOrReject(createQrDto);

    // Variable para almacenar el QR creado, inicialmente nulo
    let createdQr: QrDocument | null = null;

    // Crear una nueva instancia del modelo QR con los datos proporcionados
    const newQr = new this.qrModel(createQrDto);
    newQr.name = createQrDto.name.toLowerCase();

    // Si no se proporciona un URL, se genera automáticamente
    if (!createQrDto.qrUrl) {
      const slug = generateSlug(12);
      newQr.qrUrl = `https://qr.cocobongo.com/${slug}`
    }


    try {
      // Verificar si ya existe un QR con el mismo nombre
      const existingQr = await this.qrModel.findOne({ name: createQrDto.name.toLowerCase() }).exec();
      if (existingQr) {
        // Si el QR ya existe, retornar un error o manejar el caso según sea necesario
        throw new ConflictException('Ya existe un QR con el mismo nombre');
      }

      // Usar la función externa para buscar y asignar la ubicación y la categoría
      await this.findAndAssignLocationAndCategory(newQr, createQrDto.location, createQrDto.category);

      // Guardar la instancia del QR en la base de datos
      createdQr = await newQr.save();

      // Crear la imagen del QR solo si la creación del QR fue exitosa
      try {
        await this.createQrImage(createQrDto.name, newQr.qrUrl);

        // Guardar el QR con la referencia a la imagen
        await createdQr.save();

      } catch (error) {
        // Si ocurre un error al crear la imagen del QR, eliminar el QR creado
        await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
        throw new InternalServerErrorException('Error al generar la imagen del QR');
      }

      try {
        switch (newQr.category.categoryType) {
          case "images":
            try {

              await this.imagesService.createImages(createdQr, files);

            } catch (error) {
              throw new InternalServerErrorException('Error al crear las imágenes');
            }
            break;

          case "documents":
            // todo Modificar logica para que funcione con documents!!!
            // try {
            //   let orderCount = 1;
            //   for (const file of files) {
            //     const createImageDto: CreateImageDto = {
            //       name: file.originalname,
            //       imageReference: '',
            //       order: orderCount,
            //       qr: createdQr._id.toString(),
            //     };
            //     orderCount += 1;

            //     await this.imagesService.create(createImageDto, file);
            //   }
            // } catch (error) {
            //   throw new InternalServerErrorException('Error al crear las imágenes');
            // }
            break;

          default:
            try {
              await this.linkService.createLink(createdQr);
            } catch {
              throw new InternalServerErrorException('Error al crear el link');
            }
            break;
        }
      } catch (error) {
        // Si ocurre un error al procesar las imágenes, eliminar el QR creado
        await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
        throw new InternalServerErrorException('Error al generar procesar los archivos QR');

      }

      // Obtener datos según el tipo de categoría
      const qrData = await this.getDataType(createdQr._id, newQr.category.categoryType);

      // Crear la respuesta DTO a partir del QR creado
      const qrResponse = QrResponseDTO.from(createdQr);
      qrResponse.qrData = qrData;

      // Retornar la respuesta DTO con los datos del QR
      return qrResponse;

    } catch (error) {
      // En caso de error en cualquier parte del proceso:

      // Eliminar el QR creado si existe
      if (createdQr) {
        await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
      }

      // Manejar excepciones y lanzar un error general
      handleExceptions(error);
      throw new InternalServerErrorException('Error al crear el QR y las imágenes');
    }
  }

  /** Método para obtener todos los QRs */
  async findAll(): Promise<QrDocument[]> {

    return await this.qrModel.find().populate(this.getPopulateOptions()).exec();
  }

  /** Método para encontrar un QR por ID o nombre */
  async findOne(term: string): Promise<QrDocument> {
    // Verificar si el término proporcionado es un ID válido de MongoDB
    const isMongoId = Types.ObjectId.isValid(term);
    // Inicializar la variable qr para almacenar el documento encontrado
    let qr: QrDocument | null;

    try {
      if (isMongoId) {
        // Si el término es un ID de MongoDB, buscar el documento por ID
        qr = await this.qrModel
          .findById(term)
          .populate(this.getPopulateOptions())
          .exec();
      } else {
        // Si el término no es un ID de MongoDB, buscar el documento por nombre
        qr = await this.qrModel
          .findOne({ qrUrl: term })
          .populate(this.getPopulateOptions())
          .exec();
      }

      if (!qr) {
        throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`);
      }

      // Obtener datos según el tipo de categoría
      const qrData = await this.getDataType(qr._id, qr.category.categoryType);

      // Agregar datos relacionados al documento
      (qr as any).qrData = qrData;

      // Devolver QR encontrado con datos adicionales
      return qr;
    } catch (error) {
      console.error('Error en findOne:', error);
      throw new InternalServerErrorException('Error al buscar el registro QR');
    }
  }

  /** Método para actualizar un QR   */
  async update(term: string, updateQrDto: UpdateQrDto, files: Express.Multer.File[]): Promise<QrResponseDTO> {

    const qr = await this.findOne(term); // Buscar QR existente

    if (!qr) {
      // Si no se encuentra el QR, lanzar una excepción
      throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`);
    }

    let oldQrImagePath: string | null = null; // Ruta de la imagen actual del QR
    let newQrImagePath: string | null = null; // Nueva ruta de la imagen del QR

    if (updateQrDto.name) {
      // Convertir el nombre a minúsculas y actualizar las rutas de la imagen
      updateQrDto.name = updateQrDto.name.toLowerCase();
      oldQrImagePath = path.join(process.cwd(), qr.qrImageReference);
      newQrImagePath = path.join(process.cwd(), 'qr-images', `${updateQrDto.name}.png`);
    }

    if (updateQrDto.location) {
      // Convertir la ubicación a ObjectId y actualizar la ubicación del QR
      const _idLocation = new Types.ObjectId(updateQrDto.location);
      const location = await this.locationModel.findById(_idLocation).exec();
      if (location) {
        qr.location = location;
      } else {
        throw new NotFoundException(`Ubicación con ID ${_idLocation} no encontrada`);
      }
    }

    if (updateQrDto.category) {
      // Convertir la categoría a ObjectId y actualizar la categoría del QR
      const _idCategory = new Types.ObjectId(updateQrDto.category);
      const category = await this.categoryModel.findById(_idCategory).exec();
      if (category) {
        qr.category = category;
      } else {
        throw new NotFoundException(`Categoría con ID ${_idCategory} no encontrada`);
      }
    }

    // Procesar archivos subidos si existen
    if (files && files.length > 0) {
      files.forEach(file => {
        console.log(file); // Lógica para procesar cada archivo
      });
    }

    // Actualizar fecha de modificación
    updateQrDto.modifiedAt = new Date().toISOString().split('T')[0];

    // Asignar valores del DTO al QR
    Object.assign(qr, updateQrDto);

    try {
      const updatedQr = await qr.save(); // Guardar cambios en la base de datos

      // Renombrar la imagen del QR si el nombre fue actualizado
      if (oldQrImagePath && newQrImagePath && fs.existsSync(oldQrImagePath)) {
        fs.renameSync(oldQrImagePath, newQrImagePath);
        // Actualizar la referencia de la imagen en el QR
        qr.qrImageReference = path.relative(process.cwd(), newQrImagePath);
        await qr.save(); // Guardar el QR con la referencia de la imagen actualizada
      }

      // Devolver QR actualizado
      return QrResponseDTO.from(updatedQr);

    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException('Error al actualizar el registro QR');
    }
  }

  /** Método para eliminar un QR y su imagen asociada */
  async remove(id: string): Promise<{ msg: string }> {
    // Buscar el QR en la base de datos para obtener la referencia de la imagen
    const qr = await this.qrModel.findById(id).exec();
    console.log("encontro el qr");
    console.log('QR:', qr);
    console.log(qr.category.categoryType);
    if (!qr) {
      // Si el QR no existe, lanzar una excepción
      console.log("no encontro qr");
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
    }

    // Obtener la ruta absoluta de la imagen del QR
    const qrImagePath = path.join(process.cwd(), qr.qrImageReference);
    console.log("encontro la ruta de la imagen qr");
    console.log('qrImagenPath', qrImagePath);


    try {
      // Obtener la categoría usando el ObjectId
      const category = await this.categoryModel.findById(qr.category).exec();
      console.log("Busca la categoria");
      console.log('Category:', category);

      // Verificar si la categoría del QR es "links"
      console.log("Verifica si la categoria es links");
      if (category && category.categoryType === 'links') {
        // Intentar eliminar los enlaces asociados usando el LinksService
        console.log("encontro que la categoria es links");
        await this.linkService.removeByQrId(id);
        console.log("1.-  Se debe eliminar registro de link");
      }

      // Eliminar el QR de la base de datos
      const { deletedCount } = await this.qrModel.deleteOne({ _id: id }).exec();
      console.log("se elimino el qr de la base de datos");
      console.log("2.-  Se debe eliminar registro de qr");


      if (deletedCount === 0) {
        // Si no se eliminó ningún documento, lanzar una excepción
        console.log("encontro que no hay qr que coincida para ser borrado");
        throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
      }

      // Intentar eliminar la imagen del QR si existe
      if (fs.existsSync(qrImagePath)) {
        console.log("elimina la imagen de qr");
        fs.unlinkSync(qrImagePath);
      }

      // Retornar mensaje de éxito si el QR y la imagen se eliminaron correctamente
      console.log("se pudo eliminar el qr y la imagen");
      return { msg: "QR eliminado exitosamente" };
    } catch (error) {
      // Manejar posibles errores al eliminar el QR o la imagen
      if (error instanceof BadRequestException) {
        // Re-lanzar excepción de BadRequestException
        console.log("error al eliminar el qr o la imagen");
        throw error;
      }
      // Manejar otras excepciones
      handleExceptions(error);
      throw new InternalServerErrorException('Error al eliminar el QR y su imagen');
    }
  }

  /** Método para buscar QRs por término  */
  async search(term: string): Promise<QrDocument[]> {
    const qrs = await this.qrModel
      .find({ name: { $regex: `.*${term}.*`, $options: 'i' } })
      .populate(this.getPopulateOptions())
      .limit(20)
      .exec();

    if (!qrs.length) throw new NotFoundException('Su búsqueda no arrojó ningún resultado');

    return qrs;
  }

  /** Método para buscar QRs con filtros de ubicación y categoría */
  async findQrsWithFilters(location?: string, category?: string): Promise<QrResponseDTO[]> {
    try {
      let query = this.qrModel.find();

      // Filtrar por ubicación si se proporciona
      if (location) {
        const locations = await this.locationModel
          .find({ name: { $regex: new RegExp(location, 'i') } })
          .select('_id')
          .exec();

        if (locations.length > 0) {
          query = query.where('location').in(locations.map(loc => loc._id));
        } else {
          return [];
        }
      }

      // Filtrar por categoría si se proporciona
      if (category) {
        const categories = await this.categoryModel
          .find({ name: { $regex: new RegExp(category, 'i') } })
          .select('_id')
          .exec();

        if (categories.length > 0) {
          query = query.where('category').in(categories.map(cat => cat._id));
        } else {
          return [];
        }
      }

      // Ejecutar la consulta y poblar las referencias de ubicación y categoría
      const qrs = await query
        .populate(this.getPopulateOptions())
        .exec();


      // Procesar los resultados para obtener los datos adicionales según el tipo de categoría
      const qrPromises = qrs.map(async qr => {
        const qrDto = QrResponseDTO.from(qr);
        qrDto.qrData = await this.getDataType(qr._id, qr.category.categoryType);
        return qrDto;
      });

      // Devolver los resultados procesados
      return await Promise.all(qrPromises);
    } catch (error) {
      console.log(error);
      handleExceptions(error);
    }
  }

  /** Método para obtener datos según el tipo de categoría  */
  async getDataType(id: Types.ObjectId, categoryType: string): Promise<any> {
    const s3_Url = s3Url()
    if (categoryType === 'images') {
      const images = await this.imageModel.find({ qr: id }).sort({ order: 1 }).exec();
      return images.map(image => ({ img: `${s3_Url}/${image.name}`, order: image.order }));
    } else if (categoryType === 'documents') {
      const documents = await this.fileModel.find({ qr: id }).exec();
      return documents.map(document => ({ doc: `${s3_Url}/${document.name}`, value: document.documentReference }));
    } else {
      const documents = await this.linkModel.find({ qr: id }).exec();
      return documents.map(document => ({ link: document.url }));
    }
  }

  /** Método para crear la imagen del QR y guardarla en S3 */
  private async createQrImage(name: string, content: string): Promise<void> {
    try {
      // Generar el contenido del QR
      const qrData = `${content}`;

      // Opciones de configuración para la generación del QR
      const options = {
        color: {
          dark: '#000000', // Color del QR
          light: '#FFFFFF', // Color del fondo
        },
        width: 1000, // Ancho de la imagen
        margin: 1, // Margen alrededor del QR
      };

      // Generar la imagen del QR y obtenerla como un buffer
      const qrBuffer = await QRCode.toBuffer(qrData, options);

      // Crear un objeto de archivo simulado con el buffer del QR para subir a S3
      const file: Express.Multer.File = {
        originalname: `${name}.png`, // Nombre del archivo
        buffer: qrBuffer, // Contenido del archivo en buffer
        // Atributos adicionales requeridos por Express.Multer.File
        fieldname: '',
        encoding: '',
        mimetype: 'image/png',
        size: qrBuffer.length,
        stream: Readable.from(qrBuffer),
        destination: '',
        filename: '',
        path: '',
      };

      // Subir el archivo a S3 usando el método uploadFile
      const uploadResult = await this.s3Service.uploadFile(file);

      // Verificar si la subida fue exitosa
      if (!uploadResult.success) {
        throw new Error('No se pudo subir la imagen del QR a S3');
      }

    } catch (error) {
      console.error('Error al generar la imagen del QR:', error);
      throw new Error('No se pudo generar la imagen del QR');
    }
  }

  /** Función para buscar y asignar la ubicación y la categoría */
  private async findAndAssignLocationAndCategory(qr: QrDocument, locationId: string, categoryId: string): Promise<void> {
    // Buscar la ubicación en la base de datos
    const location = await this.locationModel.findById(locationId).exec();
    // Asignar la ubicación encontrada al QR
    qr.location = location;

    // Buscar la categoría en la base de datos
    const category = await this.categoryModel.findById(categoryId).exec();
    // Asignar la categoría encontrada al QR
    qr.category = category;
  }

  private getPopulateOptions() {
    return [
      {
        path: 'location',
        select: '_id locationNumber name',
      },
      {
        path: 'category',
        select: '_id categoryType name',
      },
    ];
  }

}
