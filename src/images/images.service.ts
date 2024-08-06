import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { ImageDocument } from './entities/image.entity';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { QrDocument } from 'src/qrs/entities/qr.entity';
import { validateOrReject } from 'class-validator';
import ImageResponseDTO from './dto/image-response.dto';
import { handleExceptions } from 'src/common/helpers/handle-exceptions.helper';
import { S3Service } from 'src/s3/s3.service';
import * as path from 'path';
import * as fs from 'fs';
import { s3Url } from 'src/s3-credentials';
// import { replaceSpacesWithUnderscores } from 'src/common/helpers/replaceSpacesWithUnder';

@Injectable()
export class ImagesService {

  constructor(

    @InjectModel('Image')
    private readonly imageModel: Model<ImageDocument>,
    @InjectModel('Qr')
    private readonly qrModel: Model<QrDocument>,
    private readonly S3Service: S3Service,

  ) { }

  /**   Metodo para crear una nueva imagen */
  async create(createImageDto: CreateImageDto, file: Express.Multer.File): Promise<ImageResponseDTO> {
    // Validar el DTO de entrada
    await validateOrReject(createImageDto);

    if (!file) {
      throw new InternalServerErrorException('Error al cargar el archivo de imagen');

    }

    try {

      // Convertir el campo order a número si es una cadena
      createImageDto.order = typeof createImageDto.order === 'string'
        ? parseInt(createImageDto.order, 10)
        : createImageDto.order;

      // Crear el nuevo registro de imagen
      const newImage = new this.imageModel(createImageDto);

      newImage.name = file.originalname;

      const s3_Url = s3Url()
      newImage.s3Reference = `${s3_Url}/${file.originalname}`

      // Relacionar la imagen con el QR, si es necesario
      const qr = await this.qrModel.findById(createImageDto.qr);
      newImage.qr = qr;

      // Subir el archivo a S3
      const s3Result = await this.S3Service.uploadFile(file);
      if (!s3Result.success) {
        throw new InternalServerErrorException('Error al subir el archivo a S3');
      }

      // Guardar registro de imagen con las referencias actualizadas en la base de datos
      await newImage.save();

      // Devolver la respuesta DTO de la imagen guardada
      return ImageResponseDTO.from(newImage);

    } catch (error) {
      console.error('Error:', error);  // Registrar el error

      throw new InternalServerErrorException('Error al crear registro de imagen');
    }

  }

  /**
   * The function `createImages` asynchronously creates image records associated with a QR code document
   * using the provided files.
   * @param {QrDocument} qr - The `qr` parameter in the `createImages` function is of type `QrDocument`.
   * It seems to contain an `_id` property that is being extracted using destructuring in the function.
   * @param files - The `files` parameter in the `createImages` function is an array containing the image
   * files that need to be processed and saved. Each element in the array represents an image file and
   * may contain information such as the original name of the file and the file itself. The function
   * iterates over each file
   */
  async createImages(qr: QrDocument, files: Array<any>) {
    const { _id } = qr;
    if (files.length <= 0) {
      throw new InternalServerErrorException('Error al cargar los archivos de imagen');
    }

    try {
      const s3_Url = s3Url()
      let orderCount = 1;
      for (const file of files) {
        const createImageDto: CreateImageDto = {
          name: file.originalname,
          s3Reference: `${s3_Url}/${file.originalname}`,
          order: orderCount,
          qr: _id.toString(),
        }
        orderCount += 1;

        await this.create(createImageDto, file);
      }
    } catch (error) {
      throw new InternalServerErrorException('Error Crear los registros de imagen');

    }
  }

  /**
   * The function `findImagesWithFilters` in TypeScript asynchronously retrieves images with optional
   * filters based on a query string.
   * @param {string} [qr] - The `findImagesWithFilters` function is an asynchronous function that
   * retrieves images based on optional query parameters.
   * @returns An array of ImageResponseDTO objects is being returned.
   */
  async findImagesWithFilters(
    qr?: string,
  ): Promise<Array<ImageResponseDTO>> {

    try {
      let query = this.imageModel.find();

      if (!qr) {

        const images = await query.populate({
          path: 'qr',
          select: '_id name'
        }).exec()

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
      const images = await query.populate({
        path: 'qr',
        select: '_id name'
      }).exec()

      return images.map(ImageResponseDTO.from)

    } catch (error) {
      console.log(error)
      handleExceptions(error)
    }
  }

  // -----------------------------------------------------
  async findOne(term: string): Promise<ImageDocument> {

    const isMongoId = Types.ObjectId.isValid(term)

    let image: ImageDocument | null

    if (isMongoId) {
      image = await this.imageModel.findById(term)
        .populate({
          path: 'qr',
          select: '_id name'
        })
        .exec()

    } else {
      image = await this.imageModel.findOne({ name: term })
        .populate({
          path: 'qr',
          select: '_id name'
        })
        .exec()
    }

    if (!image) {
      throw new NotFoundException(`registro con el parametro ${term} no ha sido encontrado`)
    }

    return image
  }

  /**
   * Actualiza una imagen existente con nuevos datos y un archivo opcional.
   * @param id ID de la imagen a actualizar.
   * @param updateImageDto DTO con los nuevos datos para la imagen.
   * @param file Archivo opcional para actualizar.
   * @returns DTO de la imagen actualizada.
   */
  async update(id: string, updateImageDto: UpdateImageDto, file?: Express.Multer.File): Promise<ImageResponseDTO> {
    // Validar el DTO de entrada
    await validateOrReject(updateImageDto);

    // Buscar la imagen existente
    const image = await this.imageModel.findById(id);
    if (!image) {
      throw new NotFoundException(`Imagen con id ${id} no encontrada`);
    }

    try {
      // Convertir el campo order a número si es una cadena
      if (updateImageDto.order) {
        updateImageDto.order = typeof updateImageDto.order === 'string' ? parseInt(updateImageDto.order, 10) : updateImageDto.order;
      }

      // Si se proporciona un nuevo archivo
      if (file) {
        // Directorio para almacenar el archivo
        const uploadDir = path.join(__dirname, '..', '..', 'uploads');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Guardar el nuevo archivo en disco
        const filename = `${image._id}-${file.originalname}`;
        const newFilePath = path.join(uploadDir, filename);
        fs.writeFileSync(newFilePath, file.buffer);

        image.name = file.originalname;

        // Subir el archivo a S3 y manejar errores
        const s3Result = await this.S3Service.uploadFile(file);
        if (!s3Result.success) {
          throw new InternalServerErrorException('Error al subir el archivo a S3');
        }
        image.s3Reference = s3Result.Location;
      }

      // Actualizar la imagen con los datos proporcionados
      if (updateImageDto.qr) {
        const qr = await this.qrModel.findById(updateImageDto.qr);
        if (qr) {
          image.qr = qr;
        }
      }

      // Actualizar otros campos de la imagen
      Object.assign(image, updateImageDto);

      // Guardar la imagen actualizada
      const savedImage = await image.save();

      // Poblar el QR relacionado
      const populatedImage = await this.imageModel.findById(savedImage._id).populate('qr');

      // Devolver la respuesta DTO de la imagen actualizada
      return ImageResponseDTO.from(populatedImage);

    } catch (error) {
      console.error('Error al actualizar la imagen:', error);
      throw new InternalServerErrorException('Error al actualizar la imagen');
    }
  }

  /**
  * Elimina una imagen existente y sus archivos asociados.
  * @param id ID de la imagen a eliminar.
  * @returns Confirmación de la eliminación.
  */
  async remove(id: string): Promise<{ msg: string }> {
    // Buscar la imagen a eliminar
    const image = await this.imageModel.findById(id);
    if (!image) {
      throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
    }

    try {
      // Eliminar el archivo de S3 si existe
      if (image.s3Reference) {
        const s3Key = path.basename(image.s3Reference); // Obtener el nombre del archivo de la URL
        await this.S3Service.deleteFile(s3Key);
      }

      // Eliminar el registro de la base de datos
      const { deletedCount } = await this.imageModel.deleteOne({ _id: id });

      if (deletedCount === 0) {
        throw new BadRequestException(`Registro con id ${id} no fue encontrado`);
      }

      // Devolver una confirmación de eliminación
      return { msg: 'Registro eliminado exitosamente' };

    } catch (error) {
      console.error('Error al eliminar la imagen:', error);
      throw new InternalServerErrorException('Error al eliminar la imagen');
    }
  }

}
