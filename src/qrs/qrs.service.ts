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
import { ensureDirectoryExistence } from 'src/common/helpers/ensure-directory';

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
    private readonly linkService: LinksService,
    private readonly s3Service: S3Service,
  ) { }

  /** Método para crear un QR
   * The `create` function in TypeScript asynchronously creates a QR code along with associated data and
   * images, handling validation, database operations, and error handling throughout the process.
   * @param {CreateQrDto} createQrDto - The `createQrDto` parameter in the `async create` function is an
   * object that contains data for creating a QR code. It likely includes properties such as `name`,
   * `qrUrl`, `location`, and `category`, which are used to create a new QR code entry in the database
   * @param {Express.Multer.File[]} files - The `files` parameter in the `create` function is an array of
   * Express Multer files. These files are typically uploaded files, such as images, that are sent as
   * part of a form submission. In this function, the files are used to process images associated with
   * the QR code being created.
   * @returns The function `create` is returning a Promise that resolves to a `QrResponseDTO` object
   * containing the data of the QR code that was created, along with additional information related to
   * the QR code such as its data type.
   */
  async create(createQrDto: CreateQrDto, files: Express.Multer.File[]): Promise<QrResponseDTO> {
    // Validar el DTO usando la función validateOrReject para asegurar que los datos cumplen con las reglas definidas
    await validateOrReject(createQrDto);

    // Variable para almacenar el QR creado, inicialmente nulo
    let createdQr: QrDocument | null = null;

    // Directorio para almacenar imágenes en la raíz del proyecto
    const imagesDir = path.join(process.cwd(), 'qr-images');

    // Ruta completa del archivo de imagen del QR, se genera un nombre en minúsculas
    const qrImagePath = path.join(imagesDir, `${createQrDto.name.toLowerCase()}.png`);

    try {
      // Asegurarse de que el directorio para las imágenes exista; si no, lo crea
      ensureDirectoryExistence(imagesDir);

      // Verificar si ya existe un QR con el mismo nombre
      const existingQr = await this.qrModel.findOne({ name: createQrDto.name.toLowerCase() }).exec();
      if (existingQr) {
        // Si el QR ya existe, retornar un error o manejar el caso según sea necesario
        throw new ConflictException('Ya existe un QR con el mismo nombre');
      }

      // Crear una nueva instancia del modelo QR con los datos proporcionados
      const newQr = new this.qrModel(createQrDto);
      newQr.name = createQrDto.name.toLowerCase();

      // Si no se proporciona un URL, se genera automáticamente
      if (!createQrDto.qrUrl) {
        newQr.qrUrl = generateSlug(12);
      }

      // Buscar y asignar la ubicación asociada al QR desde la base de datos
      const location = await this.locationModel.findById(createQrDto.location).exec();
      newQr.location = location;

      // Buscar y asignar la categoría asociada al QR desde la base de datos
      const category = await this.categoryModel.findById(createQrDto.category).exec();
      newQr.category = category;

      // Guardar la instancia del QR en la base de datos
      createdQr = await newQr.save();

      // Crear la imagen del QR solo si la creación del QR fue exitosa
      try {
        await this.createQrImage(createQrDto.name.toLowerCase(), qrImagePath, newQr.qrUrl);
        // Asignar la ruta relativa de la imagen del QR al documento creado
        createdQr.qrImageReference = path.relative(process.cwd(), qrImagePath);

        // Guardar el QR con la referencia a la imagen
        await createdQr.save();
      } catch (error) {
        // Si ocurre un error al crear la imagen del QR, eliminar el QR creado
        await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
        throw new InternalServerErrorException('Error al generar la imagen del QR');
      }

      // Procesar archivos si la categoría es 'links'
      if (category.categoryType === 'links') {
        try {
          const createLinkDto: CreateLinkDto = {
            name: createdQr.name,
            url: createdQr.qrUrl,
            qr: createdQr._id.toString(),
          };

          await this.linkService.create(createLinkDto);
        } catch {
          // Si ocurre un error al procesar el link, eliminar el QR creado
          await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
          throw new InternalServerErrorException('Error al crear el link');
        }
      }

      // Procesar archivos si la categoría es 'images'
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

            await this.imagesService.create(createImageDto, file);
          }
        } catch (error) {
          // Si ocurre un error al procesar las imágenes, eliminar el QR creado
          await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
          throw new InternalServerErrorException('Error al crear las imágenes');
        }
      }

      // Obtener datos según el tipo de categoría
      const qrData = await this.getDataType(createdQr._id, category.categoryType);

      // Crear la respuesta DTO a partir del QR creado
      const qrResponse = QrResponseDTO.from(createdQr);
      qrResponse.qrData = qrData;

      // Retornar la respuesta DTO con los datos del QR
      return qrResponse;

    } catch (error) {
      // En caso de error en cualquier parte del proceso:

      // Eliminar la imagen del QR si existe (solo si fue creada)
      if (fs.existsSync(qrImagePath) && !fs.existsSync(qrImagePath)) {
        fs.unlinkSync(qrImagePath);
      }

      // Eliminar el QR creado si existe
      if (createdQr) {
        await this.qrModel.deleteOne({ _id: createdQr._id }).exec();
      }

      // Manejar excepciones y lanzar un error general
      handleExceptions(error);
      throw new InternalServerErrorException('Error al crear el QR y las imágenes');
    }
  }

  /** Método para obtener todos los QRs
  * The `findAll` function retrieves all QrDocuments while populating the 'location' and 'category'
  * fields with specific selected fields.
  * @returns The `findAll` function is returning a Promise that resolves to an array of `QrDocument`
  * objects. The function uses `await` to wait for the result of the `qrModel.find()` method, which
  * queries the database for all `QrDocument` objects. The results are then populated with additional
  * data from the `location` and `category` collections, selecting only specific fields (`_
  */
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

  /** Método para encontrar un QR por ID o nombre
   * The function `findOne` searches for a QR document by either ID or name, populates related fields,
   * retrieves additional data based on category type, and returns the QR document with additional
   * data.
   * @param {string} term - The `findOne` function you provided is an asynchronous function that
   * searches for a document in a MongoDB collection based on the term provided. If the term is a valid
   * MongoDB ID, it searches for the document by ID; otherwise, it searches for the document by name.
   * @returns The `findOne` function returns a Promise that resolves to a `QrDocument` object. This
   * object represents a QR code document with additional data related to its location, category, and
   * specific QR data. The function first checks if the provided term is a valid MongoDB ID, then
   * searches for the QR document either by ID or by name. If the document is found, it populates the
   * location and
   */
  async findOne(term: string): Promise<QrDocument> {
    // Verificar si el término proporcionado es un ID válido de MongoDB
    const isMongoId = Types.ObjectId.isValid(term);
    // Inicializar la variable qr para almacenar el documento encontrado
    let qr: QrDocument | null;

    try {
      if (isMongoId) {
        // Si el término es un ID de MongoDB, buscar el documento por ID
        qr = await this.qrModel.findById(term)
          // Poblar el campo 'location' con los datos de la ubicación asociada
          .populate({
            path: 'location',
            // Seleccionar solo los campos necesarios de la ubicación
            select: '_id locationNumber name'
          })
          // Poblar el campo 'category' con los datos de la categoría asociada
          .populate({
            path: 'category',
            // Seleccionar solo los campos necesarios de la categoría
            select: '_id categoryType name'
          })
          // Ejecutar la consulta
          .exec();
      } else {
        // Si el término no es un ID de MongoDB, buscar el documento por nombre
        qr = await this.qrModel.findOne({ qrUrl: term })
          // Poblar el campo 'location' con los datos de la ubicación asociada
          .populate({
            path: 'location',
            // Seleccionar solo los campos necesarios de la ubicación
            select: '_id locationNumber name'
          })
          // Poblar el campo 'category' con los datos de la categoría asociada
          .populate({
            path: 'category',
            // Seleccionar solo los campos necesarios de la categoría
            select: '_id categoryType name'
          })
          // Ejecutar la consulta
          .exec();
      }

      // Si no se encuentra el documento, lanzar una excepción de "No encontrado"
      if (!qr) {
        throw new NotFoundException(`Registro con el parámetro ${term} no ha sido encontrado`);
      }

      // Obtener los datos adicionales según el tipo de categoría del QR encontrado
      const qrData = await this.getDataType(qr._id, qr.category.categoryType);

      // Agregar los datos relacionados obtenidos al documento del QR
      (qr as any).qrData = qrData;

      // Devolver el documento del QR encontrado junto con los datos adicionales
      return qr;

    } catch (error) {
      // Si ocurre un error, mostrarlo en la consola para depuración
      console.error('Error en findOne:', error);
      // Lanzar una excepción interna del servidor indicando que hubo un error al buscar el QR
      throw new InternalServerErrorException('Error al buscar el registro QR');
    }
  }

  /** Método para actualizar un QR
  * The function `update` in TypeScript updates a QR record with the provided data, including handling
  * image file uploads and updating related fields like location and category.
  * @param {string} term - The `term` parameter in the `update` function represents the search term
  * used to find the existing QR code that needs to be updated. It could be an identifier, name, or any
  * unique attribute that helps locate the specific QR code in the database.
  * @param {UpdateQrDto} updateQrDto - The `updateQrDto` parameter in the `update` method is an object
  * that contains the data to update a QR code. It likely includes properties such as `name`,
  * `location`, `category`, and `modifiedAt` among others. This object is used to update the existing
  * QR code
  * @param {Express.Multer.File[]} files - The `files` parameter in the `update` function represents an
  * array of files that are uploaded along with the update request. In this function, the code is
  * checking if there are any files uploaded and then processing each file individually within the
  * `files.forEach` loop.
  * @returns The `update` function returns a Promise that resolves to a `QrResponseDTO` object
  * representing the updated QR after processing the update request and saving changes to the database.
  */
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

  /** Método para eliminar un QR y su imagen asociada.
  * The function `remove` asynchronously removes a QR code and its associated image from the database,
  * handling different scenarios such as checking the category type, deleting associated links, and
  * managing errors.
  * @param {string} id - The `remove` method you provided is an asynchronous function that removes a QR
  * code and its associated image from the database. It performs the following steps:
  * @returns The `remove` function returns a Promise that resolves to an object with a `msg` property
  * containing the message "QR eliminado exitosamente" (QR deleted successfully) if the QR and its
  * associated image were successfully removed.
  */
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

  /** Método para buscar QRs por término
   * The function searches for QrDocuments based on a given term and returns a maximum of 20 results
   * with specific fields populated.
   * @param {string} term - The `search` function you provided is an asynchronous function that
   * searches for `QrDocument` objects based on a given `term`. The function uses the `qrModel` to find
   * documents where the `name` field matches the provided term using a case-insensitive regex search.
   * It then populates
   * @returns The `search` function is returning a Promise that resolves to an array of `QrDocument`
   * objects based on the search term provided. The function performs a search in the `qrModel`
   * collection using a case-insensitive regex match on the `name` field with the provided term. It
   * then populates the `location` and `category` fields with specific selected fields, limits the
   * results to
   */
  async search(term: string): Promise<QrDocument[]> {
    const qrs = await this.qrModel
      .find({ name: { $regex: `.*${term}.*`, $options: 'i' } })
      .populate({
        path: 'location',
        select: '_id locationNumber name' // Seleccionar solo los campos necesarios
      })
      .populate({
        path: 'category',
        select: '_id categoryType name' // Seleccionar solo los campos necesarios
      })
      .limit(20)
      .exec();

    if (!qrs.length) throw new NotFoundException('Su búsqueda no arrojó ningún resultado');

    return qrs;
  }

  /** Método para buscar QRs con filtros de ubicación y categoría
 * The function `findQrsWithFilters` retrieves QR codes with optional filters for location and
 * category, populates location and category references, processes additional data based on category
 * type, and returns a Promise of QrResponseDTO array.
 * @param {string} [location] - The `location` parameter in the `findQrsWithFilters` method is used to
 * filter the QR codes based on their location. If a location is provided, the method will search for
 * locations that match the provided name (case-insensitive) in the `locationModel` collection. If any
 * matching
 * @param {string} [category] - The `category` parameter in the `findQrsWithFilters` method is used to
 * filter the QR codes based on a specific category. If a category is provided, the method will query
 * the database to find categories that match the provided input and then filter the QR codes based on
 * those categories. If
 * @returns The `findQrsWithFilters` method returns a Promise that resolves to an array of
 * `QrResponseDTO` objects. These objects are obtained by querying the database for QR codes based on
 * optional filters for location and category. The method first constructs a query based on the
 * provided filters, then executes the query and populates references to location and category fields.
 * Finally, it processes the results to include
 */
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

  /** Método para obtener datos según el tipo de categoría
 * The function `getDataType` retrieves data based on the provided `id` and `categoryType`, returning
 * different types of data (images, documents, or links) accordingly.
 * @param id - The `id` parameter is of type `Types.ObjectId`, which is likely an identifier for a
 * specific document or entity in a MongoDB database.
 * @param {string} categoryType - The `categoryType` parameter is a string that specifies the type of
 * data to retrieve. It can have three possible values: 'images', 'documents', or any other value.
 * Depending on the value of `categoryType`, the function retrieves data from different models
 * (`imageModel`, `fileModel`,
 * @returns The `getDataType` function returns different data based on the `categoryType` parameter
 * provided:
 * - If `categoryType` is 'images', it returns an array of objects with properties `value` and `order`
 * extracted from the images found in the imageModel collection.
 * - If `categoryType` is 'documents', it returns an array of objects with properties `doc` and `value`
 */
  async getDataType(id: Types.ObjectId, categoryType: string): Promise<any> {
    if (categoryType === 'images') {
      const images = await this.imageModel.find({ qr: id }).sort({ order: 1 }).exec();
      return images.map(image => ({ value: image.imageReference, order: image.order }));
    } else if (categoryType === 'documents') {
      const documents = await this.fileModel.find({ qr: id }).exec();
      return documents.map(document => ({ doc: document.name, value: document.documentReference }));
    } else {
      const documents = await this.linkModel.find({ qr: id }).exec();
      return documents.map(document => ({ doc: document.name, value: document.url }));
    }
  }

  /** Método para crear la imagen del QR
    * The function `createQrImage` generates a QR code image based on the provided content and saves it
    * to a specified file path, handling errors and file operations along the way.
    * @param {string} name - The `name` parameter in the `createQrImage` function is not being used in
    * the function implementation. It seems like it was intended to be used for something specific, but
    * currently, it is not being utilized within the function. If you intended to use it for a specific
    * purpose, you
    * @param {string} filePath - The `filePath` parameter in the `createQrImage` function is the path
    * where the QR code image will be saved. It should be a string that represents the file path
    * including the file name and extension where the QR code image will be stored. For example, it could
    * be something like `"
    * @param {string} content - The `content` parameter in the `createQrImage` function is used to
    * generate the data that will be encoded in the QR code. In the provided code snippet, the `content`
    * is prefixed with `https://www.` to create a valid URL for the QR code data.
    */
  private async createQrImage(name: string, filePath: string, content: string): Promise<void> {
    try {
      // Generar el contenido del QR
      const qrData = `http://localhost:3000/api/v2/qrs/${content}`;

      // Generar el contenido del QR
      // const qrData = `https://www.google.com.mx`;

      // Generar y guardar la imagen del QR en el archivo especificado
      await QRCode.toFile(filePath, qrData, {
        color: {
          dark: '#000000', // Color del QR
          light: '#FFFFFF', // Color del fondo
        },
        width: 300, // Ancho de la imagen
        margin: 1,  // Margen alrededor del QR
      });

      // Verificar si el archivo se ha creado y tiene contenido
      const fileExists = fs.existsSync(filePath);
      if (fileExists) {
        const stats = fs.statSync(filePath);
      } else {
        console.error('El archivo no existe después de la generación.');
      }
    } catch (error) {
      console.error('Error al generar la imagen del QR:', error);

      // Intentar eliminar el archivo si ocurrió un error durante la generación
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw new Error('No se pudo generar la imagen del QR');
    }
  }

}
