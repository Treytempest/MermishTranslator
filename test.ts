import { getSheetData } from './functions/sheetsHandler';
import * as fs from 'fs';

getSheetData().then((rows) => {
    const duplicates: { [key: string]: { keys: string[], lines: number[] } } = {};
    const seen: { [key: string]: boolean } = {};

    rows.forEach((row, index) => {
        const value = row[3].toLowerCase(); // Convert value to lowercase for case-insensitive comparison
        const key = row[0];

        if (value && key) {
            if (seen[value]) {
                duplicates[value].keys.push(key);
                duplicates[value].lines.push(index + 1);
            } else {
                seen[value] = true;
                duplicates[value] = { keys: [key], lines: [index + 1] };
            }
        }
    });

    const output = Object.entries(duplicates)
        .filter(([value, { keys }]) => keys.length > 1)
        .map(([value, { keys, lines }]) => `${value}: ${keys.join(', ')} (Lines: ${lines.join(', ')})`)
        .join('\n');

    fs.writeFile('output.txt', output, (err) => {
        if (err) {
            console.error('Error writing to file:', err);
        } else {
            console.log('Output written to file successfully.');
        }
    });
});