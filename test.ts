import path from 'path';
import { dataHandler } from './functions/dataHandler';

let filePath = path.join(__dirname, "Modern Mermish [Shaa-Tam'ej].xlsx");
console.log(filePath);
dataHandler.translateFile(filePath, 5, 1);