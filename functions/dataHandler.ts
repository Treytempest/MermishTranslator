import ExcelJS from 'exceljs';
import { translator } from './translator';

export class dataHandler {
    public static async translateFile(filePath: string, inCol: number, outCol: number, sheetIndex: number = 0): Promise<boolean> {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(filePath);
        const worksheet = workbook.worksheets[sheetIndex];

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber !== 0) {
                const cellData = row.getCell(inCol).text;
                console.log(`${cellData} => `);

                // Run your function on the data
                const result = translator.translate(cellData);

                // Write the result to the second column
                row.getCell(outCol).value = result;
                console.log(`${result}\n`);
            }
        });

        await workbook.xlsx.writeFile(filePath);
        return true;
    }
}