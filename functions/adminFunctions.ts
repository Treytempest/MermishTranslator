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
        console.error("Error applying updates: ", error);
    }
}
// #endregion

// #region App state management functions
// Function to restart the app
export function restartApp(): Promise<void> {
    return new Promise((resolve, reject) => {
        console.log("Restarting app...");
        exec('pm2 restart app', (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// Function to shut down the app
export function shutDownApp(): void {
    console.log("Shutting down app...");
    exec('pm2 stop app', (error) => {
        if (error) {
            console.error("Error shutting down app: ", error);
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
    return path.join(logsDir, `server-${timestamp}.log`);
}

export function clearLogs(log_directory: string): void {
    fs.readdir(log_directory, (err, files) => {
        if (err) {
            console.error(err);
            return;
        }
        for (const file of files) {
            fs.unlink(path.join(log_directory, file), err => {
                if (err) {
                    console.error(err);
                }
            });
        }
    });
}
// #endregion

// #region User management functions
function addAdmin() {
    const username: string = process.argv[2];
    const password: string = process.argv[3];
    bcrypt.hash(password, 10, (err: Error, hash: string) => {
        if (err) {
            console.error(err);
            return;
        }
        const admins = [
            {
                username: username,
                password: hash
            }
        ];
        let adminFile = path.join(__dirname, '..', 'admins.json');
        fs.writeFileSync(adminFile, JSON.stringify(admins, null, 2));
    });
    console.log(`Admin ${username} added.`);
}
//#endregion