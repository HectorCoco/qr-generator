import * as fs from 'fs';


/** Método para asegurarse de que el directorio existe
* The function `ensureDirectoryExistence` creates a directory if it does not already exist.
* @param {string} dirPath - The `dirPath` parameter is a string that represents the path of a
* directory that needs to be checked for existence. If the directory does not exist, the function will
* create it using `fs.mkdirSync` with the `recursive: true` option.
*/
export function ensureDirectoryExistence(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Directorio creado: ${dirPath}`);
    }
}