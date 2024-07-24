import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
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
import CategoryResponseDTO from 'src/categories/dto/category-response.dto';
import LocationResponseDTO from 'src/locations/dto/location-response.dto';

@Injectable()
export class QrsService {
  constructor(
    @InjectModel('Qr') private readonly qrModel: Model<QrDocument>,
    @InjectModel('Location') private readonly locationModel: Model<LocationDocument>,
    @InjectModel('Category') private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel('Image') private readonly imageModel: Model<ImageDocument>,
    @InjectModel('File') private readonly fileModel: Model<FileDocument>,
    @InjectModel('Link') private readonly linkModel: Model<LinkDocument>,
    private readonly imagesService: ImagesService,
    private readonly s3Service: S3Service,
  ) { }


  // Método para crear un QR
  async create(createQrDto: CreateQrDto, files: Express.Multer.File[]): Promise<QrResponseDTO> {
    await validateOrReject(createQrDto); // Validar DTO

    let createdQr: QrDocument | null = null;

    try {
      const newQr = new this.qrModel(createQrDto); // Crear nuevo QR
      newQr.name = createQrDto.name.toLowerCase(); // Convertir nombre a minúsculas
      newQr.qrUrl = generateSlug(12); // Generar slug para URL

      // Asignar ubicación
      const _idLocation = new Types.ObjectId(createQrDto.location);
      const location = await this.locationModel.findById(_idLocation).exec();
      newQr.location = location;

      // Asignar categoría
      const _idCategory = new Types.ObjectId(createQrDto.category);
      const category = await this.categoryModel.findById(_idCategory).exec();
      newQr.category = category;

      // Guardar QR en la base de datos
      createdQr = await newQr.save();

      // Si la categoría es del tipo 'images', procesar archivos
      if (category.categoryType === 'images') {
        try {
          let orderCount = 1;
          for (const file of files) {
            const createImageDto: CreateImageDto = {
              name: file.originalname,
              imageReference: '',
              order: orderCount,
              qr: createdQr._id.toString(),
            };
            orderCount += 1;

            await this.imagesService.create(createImageDto, file); // Crear imagen a través del ImagesService
          }
        } catch (error) {
          // En caso de error, eliminar QR creado
          await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
          throw new InternalServerErrorException('Error al crear las imágenes');
        }
      }

      // Obtener datos según el tipo de categoría
      const qrData = await this.getDataType(createdQr._id, category.categoryType);

      // Devolver QR creado con datos adicionales
      const qrResponse = QrResponseDTO.from(createdQr);
      qrResponse.qrData = qrData;

      return qrResponse;

    } catch (error) {
      // En caso de error, eliminar QR creado
      if (createdQr) {
        await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
      }

      handleExceptions(error);
      throw new InternalServerErrorException('Error al crear el QR y las imágenes');
    }
  }

  // Método para obtener todos los QRs
  async findAll(): Promise<QrDocument[]> {

    return await this.qrModel.find()
      .populate({
        path: 'location',
        select: '_id locationNumber name' // Seleccionar solo los campos necesarios
      })
      .populate({
        path: 'category',
        select: '_id categoryType name' // Seleccionar solo los campos necesarios
      }).exec();
  }

  // Método para encontrar un QR por ID o nombre
  async findOne(term: string): Promise<QrDocument> {
    const isMongoId = Types.ObjectId.isValid(term);
    let qr: QrDocument | null;

    try {
      if (isMongoId) {
        // Buscar por ID de MongoDB
        qr = await this.qrModel.findById(term)
          .populate({
            path: 'location',
            select: '_id locationNumber name' // Seleccionar solo los campos necesarios
          })
          .populate({
            path: 'category',
            select: '_id categoryType name' // Seleccionar solo los campos necesarios
          })
          .exec();
      } else {
        // Buscar por nombre
        qr = await this.qrModel.findOne({ name: term })
          .populate({
            path: 'location',
            select: '_id locationNumber name' // Seleccionar solo los campos necesarios
          })
          .populate({
            path: 'category',
            select: '_id categoryType name' // Seleccionar solo los campos necesarios
          })
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

  // Método para actualizar un QR
  async update(term: string, updateQrDto: UpdateQrDto, files: Express.Multer.File[]): Promise<QrResponseDTO> {
    const qr = await this.findOne(term); // Buscar QR existente

    if (!qr) {
      throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`);
    }

    updateQrDto.modifiedAt = new Date().toISOString().split('T')[0]; // Actualizar fecha de modificación

    if (updateQrDto.name) {
      updateQrDto.name = updateQrDto.name.toLowerCase(); // Convertir nombre a minúsculas
    }

    if (updateQrDto.location) {
      const _idLocation = new Types.ObjectId(updateQrDto.location); // Convertir ubicación a ObjectId
      const location = await this.locationModel.findById(_idLocation).exec();
      if (location) {
        qr.location = location; // Actualizar ubicación del QR
      } else {
        throw new NotFoundException(`Ubicación con ID ${_idLocation} no encontrada`);
      }
    }

    if (updateQrDto.category) {
      const _idCategory = new Types.ObjectId(updateQrDto.category); // Convertir categoría a ObjectId
      const category = await this.categoryModel.findById(_idCategory).exec();
      if (category) {
        qr.category = category; // Actualizar categoría del QR
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

    Object.assign(qr, updateQrDto); // Asignar valores del DTO al QR

    try {
      const updatedQr = await qr.save(); // Guardar cambios en la base de datos
      return QrResponseDTO.from(updatedQr); // Devolver QR actualizado
    } catch (error) {
      console.error('Error en update:', error);
      throw new InternalServerErrorException('Error al actualizar el registro QR');
    }
  }

  // Método para eliminar un QR
  async remove(id: string): Promise<{ msg: string }> {
    const { deletedCount } = await this.qrModel.deleteOne({ _id: id }).exec();

    if (deletedCount === 0) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
    }

    return { msg: "QR eliminado exitosamente" };
  }

  // Método para buscar QRs por término
  async search(term: string): Promise<QrDocument[]> {
    const qrs = await this.qrModel
      .find({ name: { $regex: `.*${term}.*`, $options: 'i' } })
      .populate('location')
      .populate('category')
      .limit(20)
      .exec();

    if (!qrs.length) throw new NotFoundException('Su búsqueda no arrojó ningún resultado');

    return qrs;
  }

  // Método para buscar QRs con filtros de ubicación y categoría
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
        .populate({
          path: 'location',
          select: '_id locationNumber name' // Seleccionar solo los campos necesarios
        })
        .populate({
          path: 'category',
          select: '_id categoryType name' // Seleccionar solo los campos necesarios
        })
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

  // Método para obtener datos según el tipo de categoría
  async getDataType(id: Types.ObjectId, categoryType: string): Promise<any> {
    if (categoryType === 'images') {
      const images = await this.imageModel.find({ qr: id }).sort({ order: 1 }).exec();
      return images.map(image => ({ value: image.imageReference, order: image.order }));
    } else if (categoryType === 'documents') {
      const documents = await this.fileModel.find({ qr: id }).exec();
      return documents.map(document => ({ doc: document.name, value: document.documentReference }));
    } else {
      return {};
    }
  }
}
