// import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, } from '@nestjs/common';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model, Types } from 'mongoose';
// import { CreateQrDto } from './dto/create-qr.dto';
// import { QrDocument } from './entities/qr.entity';
// import { UpdateQrDto } from './dto/update-qr.dto';
// import QrResponseDTO from './dto/qr-response.dto';
// import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
// import { LocationDocument } from '../locations/entities/location.entity';
// import { CategoryDocument } from 'src/categories/entities/category.entity';
// import { ImageDocument } from 'src/images/entities/image.entity';
// import { FileDocument } from 'src/files/entities/file.entity';
// import { LinkDocument } from 'src/links/entities/link.entity';
// import { S3Service } from 'src/s3/s3.service';
// import { ImagesService } from 'src/images/images.service';
// import { CreateImageDto } from 'src/images/dto/create-image.dto';
// import { generateSlug } from 'src/common/helpers/strings.helpers';
// import { validateOrReject } from 'class-validator';
// import * as QRCode from 'qrcode';
// import * as fs from 'fs';
// import * as path from 'path';
// import { LinksService } from 'src/links/links.service';
// import { CreateLinkDto } from 'src/links/dto/create-link.dto';

// @Injectable()
// export class QrsService {
//   constructor(
//     @InjectModel('Qr') private readonly qrModel: Model<QrDocument>,
//     @InjectModel('Location') private readonly locationModel: Model<LocationDocument>,
//     @InjectModel('Category') private readonly categoryModel: Model<CategoryDocument>,
//     @InjectModel('Image') private readonly imageModel: Model<ImageDocument>,
//     @InjectModel('File') private readonly fileModel: Model<FileDocument>,
//     @InjectModel('Link') private readonly linkModel: Model<LinkDocument>,
//     private readonly imagesService: ImagesService,
//     private readonly linkService: LinksService,
//     private readonly s3Service: S3Service,
//   ) { }

//   /**
//    * Crear un nuevo QR con sus imágenes y links asociados.
//    * @param createQrDto - DTO de creación del QR.
//    * @param files - Archivos subidos.
//    * @returns QR creado como QrResponseDTO.
//    */
//   async create(createQrDto: CreateQrDto, files: Express.Multer.File[]): Promise<QrResponseDTO> {
//     await validateOrReject(createQrDto);

//     const imagesDir = path.join(process.cwd(), 'qr-images');
//     const qrImagePath = path.join(imagesDir, `${createQrDto.name.toLowerCase()}.png`);

//     this.ensureDirectoryExistence(imagesDir);

//     let createdQr: QrDocument | null = null;
//     try {
//       // Verificar si ya existe un QR con el mismo nombre
//       if (await this.qrModel.findOne({ name: createQrDto.name.toLowerCase() }).exec()) {
//         throw new ConflictException('Ya existe un QR con el mismo nombre');
//       }

//       // Crear y guardar el QR
//       createdQr = new this.qrModel(createQrDto);
//       createdQr.name = createQrDto.name.toLowerCase();
//       createdQr.qrUrl = createQrDto.qrUrl || `https://www.${generateSlug(12)}`;
//       createdQr.location = await this.locationModel.findById(createQrDto.location).exec();
//       createdQr.category = await this.categoryModel.findById(createQrDto.category).exec();

//       await createdQr.save();

//       // Crear la imagen del QR
//       await this.createQrImage(createQrDto.name.toLowerCase(), qrImagePath, createdQr.qrUrl);
//       createdQr.qrImageReference = path.relative(process.cwd(), qrImagePath);
//       await createdQr.save();

//       // Manejar archivos y links según el tipo de categoría
//       await this.handleCategoryFilesAndLinks(createdQr, files);

//       const qrData = await this.getDataType(createdQr._id.toString(), createdQr.category.categoryType);
//       const qrResponse = QrResponseDTO.from(createdQr);
//       qrResponse.qrData = qrData;

//       return qrResponse;
//     } catch (error) {
//       if (fs.existsSync(qrImagePath)) {
//         fs.unlinkSync(qrImagePath);
//       }
//       if (createdQr) {
//         await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
//       }
//       handleExceptions(error);
//       throw new InternalServerErrorException('Error al crear el QR y las imágenes');
//     }
//   }

//   /**
//    * Obtener todos los QRs.
//    * @returns Array de documentos de QRs.
//    */
//   async findAll(): Promise<QrDocument[]> {
//     return this.qrModel
//       .find()
//       .populate({
//         path: 'location',
//         select: '_id locationNumber name',
//       })
//       .populate({
//         path: 'category',
//         select: '_id categoryType name',
//       })
//       .exec();
//   }

//   /**
//    * Encontrar un QR por ID o nombre.
//    * @param term - ID o nombre del QR.
//    * @returns Documento del QR encontrado.
//    */
//   async findOne(term: string): Promise<QrDocument> {
//     const isMongoId = Types.ObjectId.isValid(term);
//     let qr: QrDocument | null;

//     try {
//       qr = isMongoId
//         ? await this.qrModel.findById(term)
//           .populate({
//             path: 'location',
//             select: '_id locationNumber name',
//           })
//           .populate({
//             path: 'category',
//             select: '_id categoryType name',
//           })
//           .exec()
//         : await this.qrModel.findOne({ name: term.toLowerCase() })
//           .populate({
//             path: 'location',
//             select: '_id locationNumber name',
//           })
//           .populate({
//             path: 'category',
//             select: '_id categoryType name',
//           })
//           .exec();

//       if (!qr) {
//         throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`);
//       }

//       const qrData = await this.getDataType(qr._id.toString(), qr.category.categoryType);
//       (qr as any).qrData = qrData;

//       return qr;
//     } catch (error) {
//       console.error('Error en findOne:', error);
//       throw new InternalServerErrorException('Error al buscar el registro QR');
//     }
//   }

//   /**
//    * Actualizar un QR existente.
//    * @param term - ID o nombre del QR.
//    * @param updateQrDto - DTO de actualización del QR.
//    * @param files - Archivos subidos.
//    * @returns QR actualizado como QrResponseDTO.
//    */
//   async update(term: string, updateQrDto: UpdateQrDto, files: Express.Multer.File[]): Promise<QrResponseDTO> {
//     const qr = await this.findOne(term);

//     let oldQrImagePath: string | null = null;
//     let newQrImagePath: string | null = null;

//     if (updateQrDto.name) {
//       updateQrDto.name = updateQrDto.name.toLowerCase();
//       oldQrImagePath = path.join(process.cwd(), qr.qrImageReference);
//       newQrImagePath = path.join(process.cwd(), 'qr-images', `${updateQrDto.name}.png`);
//     }

//     if (updateQrDto.location) {
//       qr.location = await this.findLocationById(updateQrDto.location);
//     }

//     if (updateQrDto.category) {
//       qr.category = await this.findCategoryById(updateQrDto.category);
//     }

//     updateQrDto.modifiedAt = new Date().toISOString().split('T')[0];
//     Object.assign(qr, updateQrDto);

//     try {
//       const updatedQr = await qr.save();

//       if (oldQrImagePath && newQrImagePath && fs.existsSync(oldQrImagePath)) {
//         fs.renameSync(oldQrImagePath, newQrImagePath);
//         qr.qrImageReference = path.relative(process.cwd(), newQrImagePath);
//         await qr.save();
//       }

//       return QrResponseDTO.from(updatedQr);
//     } catch (error) {
//       console.error('Error en update:', error);
//       throw new InternalServerErrorException('Error al actualizar el registro QR');
//     }
//   }

//   /**
//    * Eliminar un QR y su imagen asociada.
//    * @param id - ID del QR a eliminar.
//    * @returns Mensaje de éxito.
//    */
//   async remove(id: string): Promise<{ msg: string }> {
//     const qr = await this.qrModel.findById(id).exec();
//     if (!qr) {
//       throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
//     }

//     const qrImagePath = path.join(process.cwd(), qr.qrImageReference);

//     try {
//       const category = await this.categoryModel.findById(qr.category).exec();
//       if (category && category.categoryType === 'links') {
//         await this.linkService.removeByQrId(id);
//       }

//       const { deletedCount } = await this.qrModel.deleteOne({ _id: id }).exec();
//       if (deletedCount === 0) {
//         throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
//       }

//       if (fs.existsSync(qrImagePath)) {
//         fs.unlinkSync(qrImagePath);
//       }

//       return { msg: 'QR eliminado exitosamente' };
//     } catch (error) {
//       handleExceptions(error);
//       throw new InternalServerErrorException('Error al eliminar el QR y la imagen asociada');
//     }
//   }

//   /**
//    * Obtener datos del tipo de categoría (links, images, files).
//    * @param qrId - ID del QR.
//    * @param categoryType - Tipo de categoría.
//    * @returns Datos correspondientes al tipo de categoría.
//    */
//   private async getDataType(qrId: string, categoryType: string): Promise<any> {
//     switch (categoryType) {
//       case 'links':
//         return this.linkModel.find({ qr: qrId });
//       case 'images':
//         return this.imageModel.find({ qr: qrId });
//       case 'files':
//         return this.fileModel.find({ qr: qrId });
//       default:
//         return null;
//     }
//   }

//   /**
//    * Crear imagen QR.
//    * @param qrName - Nombre del QR.
//    * @param qrImagePath - Ruta de la imagen QR.
//    * @param qrUrl - URL del QR.
//    */
//   private async createQrImage(qrName: string, qrImagePath: string, qrUrl: string): Promise<void> {
//     try {
//       await QRCode.toFile(qrImagePath, qrUrl, {
//         color: {
//           dark: '#000000',
//           light: '#ffffff',
//         },
//       });
//     } catch (error) {
//       console.error('Error al crear la imagen QR:', error);
//       throw new InternalServerErrorException('Error al crear la imagen QR');
//     }
//   }

//   /**
//    * Asegurar que el directorio existe.
//    * @param dirPath - Ruta del directorio.
//    */
//   private ensureDirectoryExistence(dirPath: string): void {
//     if (!fs.existsSync(dirPath)) {
//       fs.mkdirSync(dirPath, { recursive: true });
//     }
//   }

//   /**
//    * Manejar archivos y links según el tipo de categoría.
//    * @param qr - Documento del QR.
//    * @param files - Archivos subidos.
//    */
//   private async handleCategoryFilesAndLinks(qr: QrDocument, files: Express.Multer.File[]): Promise<void> {
//     if (qr.category.categoryType === 'links' && qr.links) {
//       for (const link of qr.links) {
//         const createLinkDto: CreateLinkDto = {
//           qr: qr._id,
//           title: link.title,
//           url: link.url,
//         };
//         await this.linkService.create(createLinkDto);
//       }
//     }

//     if (qr.category.categoryType === 'images' && files) {
//       for (const file of files) {
//         const fileName = file.originalname.toLowerCase();
//         const imagePath = path.join(process.cwd(), 'uploads', fileName);
//         fs.renameSync(file.path, imagePath);

//         const s3Response = await this.s3Service.uploadFile(file);
//         const createImageDto: CreateImageDto = {
//           name: fileName,
//           url: s3Response.Location,
//           qr: qr._id,
//         };

//         await this.imagesService.create(createImageDto);
//       }
//     }

//     if (qr.category.categoryType === 'files' && files) {
//       for (const file of files) {
//         const fileName = file.originalname.toLowerCase();
//         const filePath = path.join(process.cwd(), 'uploads', fileName);
//         fs.renameSync(file.path, filePath);

//         const s3Response = await this.s3Service.uploadFile(file);
//         const createFileDto = {
//           name: fileName,
//           url: s3Response.Location,
//           qr: qr._id,
//         };

//         const createdFile = new this.fileModel(createFileDto);
//         await createdFile.save();
//       }
//     }
//   }

//   /**
//    * Encontrar una ubicación por ID.
//    * @param locationId - ID de la ubicación.
//    * @returns Documento de la ubicación.
//    */
//   private async findLocationById(locationId: string): Promise<LocationDocument> {
//     const location = await this.locationModel.findById(locationId).exec();
//     if (!location) {
//       throw new NotFoundException(`Ubicación con id ${locationId} no ha sido encontrada`);
//     }
//     return location;
//   }

//   /**
//    * Encontrar una categoría por ID.
//    * @param categoryId - ID de la categoría.
//    * @returns Documento de la categoría.
//    */
//   private async findCategoryById(categoryId: string): Promise<CategoryDocument> {
//     const category = await this.categoryModel.findById(categoryId).exec();
//     if (!category) {
//       throw new NotFoundException(`Categoría con id ${categoryId} no ha sido encontrada`);
//     }
//     return category;
//   }
// }
