import { BadRequestException, InternalServerErrorException } from "@nestjs/common"

export function handleExceptions(error: any): any {

    if (error.code === 11000) {
        throw new BadRequestException(`Ya existe registro en la base de datos ${JSON.stringify(error.keyValue)}`)

    }
    throw new InternalServerErrorException(`No se puede crear el registro, favor de checar en consola`)
}
