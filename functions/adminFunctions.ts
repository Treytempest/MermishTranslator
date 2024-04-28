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

// Function to restart the app
function restartApp(): Promise<void> {
    return new Promise((resolve, reject) => {
        exec('pm2 restart app', (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
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
        console.log("Pulling updates...");
        await pullUpdates();
        console.log("Installing dependencies...");
        await installDependencies();
        console.log("Transpiling TypeScript...");
        await transpileTypeScript();
        console.log("Restarting app...");
        await restartApp();
    } catch (error) {
        console.error("Error applying updates: ", error);
    }
}

function makeAdminPassword() {
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
}