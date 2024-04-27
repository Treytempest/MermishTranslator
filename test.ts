import { getSheetData } from './functions/sheetsHandler';
import * as fs from 'fs';

getDuplicates();

// Random functions go here for various purposes - testing stuff, pulling information, etc.

/**
 * Retrieves duplicate values from the sheet data and writes them to a file.
 */
function getDuplicates() {
    // Retrieve the sheet data
    getSheetData().then((rows) => {
        const duplicates: { [key: string]: { keys: string[], lines: number[] } } = {};
        const seen: { [key: string]: boolean } = {};

        // Iterate through each row of the sheet data
        rows.forEach((row, index) => {
            const value = row[3].toLowerCase(); // Convert value to lowercase for case-insensitive comparison
            const key = row[0];

            if (value && key) {
                // Check if the value has been seen before
                if (seen[value]) {
                    // If it has been seen, add the key and line number to the duplicates object
                    duplicates[value].keys.push(key);
                    duplicates[value].lines.push(index + 1);
                } else {
                    // If it hasn't been seen, mark it as seen and initialize the duplicates object for that value
                    seen[value] = true;
                    duplicates[value] = { keys: [key], lines: [index + 1] };
                }
            }
        });

        // Filter out duplicates with only one occurrence and format the output
        const output = Object.entries(duplicates)
            .filter(([value, { keys }]) => keys.length > 1)
            .map(([value, { keys, lines }]) => `${value}: ${keys.join(', ')} (Lines: ${lines.join(', ')})`)
            .join('\n');

        // Write the output to a file
        fs.writeFile('test files/output.txt', output, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
            } else {
                console.log('Output written to file successfully.');
            }
        });
    });
}