import { exec } from 'child_process';
import fetch from 'node-fetch';
import fs from 'fs';
import bcrypt from 'bcrypt';
import { getSheetData } from './sheetsHandler';
import path from 'path';

// Function to get the latest commit hash of the code base
async function getLatestCommitHash(): Promise<string> {
    const response = await fetch('https://api.github.com/repos/Treytempest/MermishTranslator/commits/master');
    const data = await response.json();
    return data.sha;
}

// #region Update functions
// Function to get the current commit hash
function getCurrentCommitHash(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec('git rev-parse HEAD', (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// Function to pull updates
function pullUpdates(): Promise<string> {
    console.log("Pulling updates...");
    return new Promise((resolve, reject) => {
        exec('git pull', (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                console.log(stdout.trim());
                resolve(stdout.trim());
            }
        });
    });
}

// Function to install dependencies
function installDependencies(): Promise<string> {
    console.log("Installing dependencies...");
    return new Promise((resolve, reject) => {
        exec('npm install', (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                console.log(stdout.trim());
                resolve(stdout.trim());
            }
        });
    });
}

// Function to transpile TypeScript
function transpileTypeScript(): Promise<string> {
    console.log("Transpiling TypeScript...");
    return new Promise((resolve, reject) => {
        exec('tsc', (error, stdout) => {
            if (error) {
                reject(error);
            } else {
                console.log("Done.");
                resolve(stdout.trim());
            }
        });
    });
}

// Function to check for updates
export async function checkForUpdates(): Promise<boolean> {
    console.log("Checking for updates...");
    const latestCommitHash = await getLatestCommitHash();
    const currentCommitHash = await getCurrentCommitHash();
    if (latestCommitHash === currentCommitHash) {
        console.log("No updates available.");
    } else { console.log("Update is available!"); }
    return latestCommitHash !== currentCommitHash;
}

// Function to apply updates and restart the app
export async function applyUpdates(): Promise<void> {
    try {
        await pullUpdates();
        await installDependencies();
        await transpileTypeScript();
        await restartApp();
    } catch (error) {
        console.error("Error applying updates: "+ error);
    }
}
// #endregion

// #region App state management functions
// Function to restart the app
export function restartApp(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("Restarting app...");
        exec('where pm2', (error) => {
            if (error) {
                console.error("pm2 is not installed. Unable to restart automatically.");
                resolve();
            } else {
                exec('pm2 restart app', (error) => {
                    if (error) {
                        console.error("Error restarting app: "+ error);
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            }
        });
    });
}

// Function to shut down the app
export function shutDownApp(): void {
    console.log("Shutting down app...");
    exec('where pm2', (error) => {
        if (error) {
            process.exit();
        } else { 
            exec('pm2 stop app', (error) => {
                if (error) {
                    console.error("Error shutting down app: "+ error);
                }
                
            });
        }
    });
}
// #endregion

// #region Data functions
export function createLogPath(logsDir: string): string {
    let date = new Date();
    let timestamp = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir);
    }
    return path.resolve(logsDir, `server-${timestamp}.log`);
}

export function clearLogs(log_directory: string): void {
    fs.readdir(log_directory, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const file of files) {
            fs.unlink(path.resolve(log_directory, file), err => {
                if (err) {
                    console.error(err);
                }
            });
        }
    });
}

export function getDuplicates() {
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
// #endregion
