import { exec } from 'child_process';
import fetch from 'node-fetch';

// Function to get the latest commit hash of the code base
async function getLatestCommitHash(): Promise<string> {
    const response = await fetch('https://api.github.com/Treytempest/MermishTranslator/commits/master');
    const data = await response.json();
    return data.sha;
}

// Function to get the current commit hash
function getCurrentCommitHash(): Promise<string> {
    return new Promise((resolve, reject) => {
        exec('git rev-parse HEAD', (error, stdout) => {
            if (error) {
                console.error("Unable to get current git version: "+error);
                reject(error);
            } else {
                resolve(stdout.trim());
            }
        });
    });
}

// Function to download updates
function downloadUpdates(): Promise<void> {
    return new Promise((resolve, reject) => {
        exec('git pull && npm install', (error) => {
            if (error) {
                console.error("Unable to get updates: "+error);
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

// Function to restart the app
function restartApp(): Promise<void> {
    return new Promise((resolve, reject) => {
        exec('pm2 restart app', (error) => {
            if (error) {
                console.error("Unable to restart: "+error);
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
    console.log("Downloading updates...");
    await downloadUpdates();
    console.log("Restarting server...");
    await restartApp();
}