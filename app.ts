import fs from 'fs';
import util from 'util';
import express, { Request, Response } from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import sharedsession from 'express-socket.io-session';
import createError from 'http-errors';
import { Translator } from './functions/translator';
import * as adminFunctions from './functions/adminFunctions';
import { v4 as uuidv4 } from 'uuid';

// #region Server setup
// Import required modules
require('dotenv').config({ path: './secrets.env' });

const root_path = process.env.NODE_ENV ? __dirname: process.cwd();

// Create Express app, HTTP server, and Socket.IO server
export const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Create Express session middleware
const expressSession = session({ secret: process.env.SECRET_KEY, resave: true, saveUninitialized: true });

const logsDir = path.resolve(root_path, 'logs');
var log_file = '';
if (process.env.NODE_ENV !== 'test') {
    // Create a write stream for the log file
    log_file = adminFunctions.createLogPath(logsDir);
    var log_writer = fs.createWriteStream(log_file, {flags : 'w'});
    // Override console.log to write logs to file and emit to Socket.IO clients
    let log_stdout = process.stdout;
    console.log = function(d) {
    let timestamp = new Date().toLocaleString();
    let message = `[INFO] ${timestamp} - ${util.format(d)}`;
    log_writer.write(message + '\n');
    log_stdout.write(message + '\n');
    io.emit('log update', message);
    };

    // Override console.warn to write logs to file and emit to Socket.IO clients
    console.warn = function(d) {
        let timestamp = new Date().toLocaleString();
        let message = `[WARN] ${timestamp} - ${util.format(d)}`;
        log_writer.write(message + '\n');
        log_stdout.write(message + '\n');
        io.emit('log update', message);
    };

    // Override console.error to write logs to file and emit to Socket.IO clients
    let log_stderr = process.stderr;
    console.error = function(d) {
    let timestamp = new Date().toLocaleString();
    let message = `[ERROR] ${timestamp} - ${util.format(d)}`;
    log_writer.write(message + '\n');
    log_stderr.write(message + '\n');
    io.emit('log update', message);
    };
}

// Global error handler
process.on('uncaughtException', function(err) {
    console.error(err);
});

// Listen for the exit event
process.on('exit', function(code) {
    console.log(`Server is shutting down with exit code: ${code}`);
    log_writer.end();
});

// Define the translation object
const translator = new Translator();

// Configure Express app
app.set('trust proxy', true);
app.set('view engine', 'ejs'); // Set the view engine to ejs
app.set('views', path.resolve(root_path, 'views')); // Set the views directory

// Middleware to parse request bodies
io.use(sharedsession(expressSession, { autoSave: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession);
// #endregion

// #region Translator Page

// Exporting the translate function for testing
export const translate = (req, res, next) => {
    const lastUpdated = req.body.lastUpdated;
    let englishText = req.body.englishText;
    let angloText = req.body.angloText;
    let mermishText = req.body.mermishText;
    try {
        switch (lastUpdated) {
            case 'englishText':
                if (englishText) {
                    angloText = translator.translateWords(englishText, true);
                    mermishText = translator.translateSymbols(angloText, true);
                } else {
                    angloText = '';
                    mermishText = '';
                }
                break;
            case 'angloText':
                if (angloText) {
                    englishText = translator.translateWords(angloText, false);
                    mermishText = translator.translateSymbols(angloText, true);
                } else {
                    englishText = '';
                    mermishText = '';
                }
                break;
            case 'mermishText':
                if (mermishText) {
                    angloText = translator.translateSymbols(mermishText, false);
                    englishText = translator.translateWords(angloText, false);
                } else {
                    angloText = '';
                    englishText = '';
                }
                break;
        }
        res.render('translator', { englishText: englishText, angloText: angloText, mermishText: mermishText });
    }
    catch (err) {
        next(createError(500,'Error processing translation.\n' +
                             `English Text: '${englishText}'\nAnglo Text: '${angloText}'\nMermish Text: '${mermishText}'\n` +
                             `Translation triggered by: ${lastUpdated}`));
    }
}

// Load the translator page on root requests
app.get('/', function (req, res) {
    // Render the 'translator' view
    res.render('translator', { englishText: '', angloText: '', mermishText: '' });
});

// Run the translation on post requests
app.post('/', translate);
// #endregion

// #region Admin Portal
app.get('/admin', function (req, res, next) {
    var logs = '';
    if (req.session.admin) {
        // If the user is logged in, render the admin features
        try {
            const data = fs.readFileSync(log_file, 'utf8');
            logs = data;
        } catch (err) {
            console.error(err);
            logs = 'Error reading logs. Check that the file exists.';
        }
        const adminData = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));
        const admins = adminData.map(function(admin) {
            return { username: admin.username };
        });
        res.render('admin', { user: req.session.admin, logs: logs, admins: admins });
    } else {
        // If the user is not logged in, render the login form
        res.render('admin_login', { error: req.session.error });
    }
});

app.get('/admin_login', function (req, res) { res.redirect('/admin'); });

app.post('/admin', async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    // Read the JSON file
    const admins = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));

    // Check if the entered username exists in the JSON file
    const admin = admins.find(admin => admin.username.toLowerCase() === username.toLowerCase());

    if (admin && await bcrypt.compare(password, admin.password)) {
        // If a match is found, set a session variable and reload the admin page
        console.log(`Admin ${admin.username} logged in from ${req.ip}`);
        req.session.admin = admin;
        req.session.error = null; // Clear any previous error
        res.redirect('/admin');
    } else {
        // If no match is found, reload the admin page with the login form and an error message
        console.warn(`Failed login attempt from ${req.ip}`);
        req.session.error = 'Invalid credentials'; // Store the error message in the session
        res.redirect('/admin_login');
    }
});

app.get('/admin/*', (req, res, next) => {
    if (req.session.admin) {
        res.redirect('/admin');
    } else {
        next(createError(403,'Forbidden'));
    }
});

// #region Admin Functions
app.post('/admin/check-updates', async (req, res, next) => {
    if (req.session.admin) {
        const hasUpdates = await adminFunctions.checkForUpdates();
        res.json({ hasUpdates });
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/apply-updates', async (req, res, next) => {
    if (req.session.admin) {
        await adminFunctions.applyUpdates();
        res.sendStatus(200);
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/logout', (req: Request, res: Response, next) => {
    if (req.session.admin) {
        req.session.destroy((err: Error) => {
            if(err) {
                console.log(err);
                return res.sendStatus(500);
            }
            res.redirect('/admin');
        });
    } else {
        res.redirect('/admin_login', { error: 'Please log in to log out.' });
    }
});

app.post('/admin/shutdown', (req, res, next) => {
    if (req.session.admin) {
        adminFunctions.shutDownApp();
        res.sendStatus(200);
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/restart', async (req, res, next) => {
    if (req.session.admin) {
        await adminFunctions.restartApp();
        res.sendStatus(200);
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/clear-logs', (req, res, next) => {
    if (req.session.admin) {
        if (process.env.NODE_ENV !== 'test') {
            log_writer.end();
            adminFunctions.clearLogs(logsDir);
            log_file = adminFunctions.createLogPath(logsDir);
            log_writer = fs.createWriteStream(log_file, {flags : 'w'});
        }
        console.log('Logs cleared.');
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/rebuild-dictionaries', async (req, res, next) => {
    if (req.session.admin) {
        await translator.initializeDictionaries();
        res.sendStatus(200);
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/add-admin', (req, res, next) => {
    if (req.session.admin) {
        const username = req.body.username;
        const password = req.body.password;
        const adminData = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));
        // Check if a user with the same username already exists
        if (adminData.some(admin => admin.username.toLowerCase() === username.toLowerCase())) {
            return res.status(400).json({ error: 'A user with this username already exists' });
        }
        const hashedPassword = bcrypt.hashSync(password, 10);
        adminData.push({ username: username, password: hashedPassword });
        fs.writeFileSync(path.resolve(root_path, 'admins.json'), JSON.stringify(adminData));
        console.log(`Admin ${username} added by ${req.session.admin.username}`);
        const newData = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));
        const admins = newData.map(function(admin) {
            return { username: admin.username };
        });
        res.json({ admins });
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/remove-admin', (req, res, next) => {
    if (req.session.admin) {
        if (req.session.admin.username === req.body.username) {
            return next(createError(400,'Cannot remove the currently logged in admin.'));
        }
        const username = req.body.username;
        const adminData = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));
        if (adminData[0].username === username) {
            return next(createError(401,'Cannot remove the initial admin.'));
        }
        const updatedAdminData = adminData.filter(admin => admin.username !== username);
        fs.writeFileSync(path.resolve(root_path, 'admins.json'), JSON.stringify(updatedAdminData));
        console.log(`Admin ${username} removed by ${req.session.admin.username}`);
        const newData = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));
        const admins = newData.map(function(admin) {
            return { username: admin.username };
        });
        res.json({ admins });
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/update-password', (req, res, next) => {
    if (req.session.admin) {
        const username = req.body.username;
        const password = req.body.password;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const adminData = JSON.parse(fs.readFileSync(path.resolve(root_path, 'admins.json'), 'utf8'));
        if (adminData[0].username === username && req.session.admin.username !== username) {
            return next(createError(401,'Only the initial admin can modify their password.'));
        }
        const updatedAdminData = adminData.map(admin => {
            if (admin.username === username) {
                return { username: username, password: hashedPassword };
            }
            return admin;
        });
        fs.writeFileSync(path.resolve(root_path, 'admins.json'), JSON.stringify(updatedAdminData));
        console.log(`Password for admin ${username} updated by ${req.session.admin.username}`);
        res.sendStatus(200);
    } else { next(createError(403,'Forbidden')); }
});
// #endregion

// #endregion

// Catch-all route handler
app.use((req, res, next) => {
    next(createError(404, 'Not found'));
});

// Error handler
app.use(function (err, req, res, next) {
    switch (err.status) {
        case 400: // Bad request
            res.status(400).render('error/400');
            break;
        case 401: // Unauthorized
            res.status(401).render('error/401');
            break;
        case 403: // Forbidden
            console.warn(`Attempt to access forbidden function from ${req.ip}`);
            res.status(403).render('error/403');
            break;
        case 404: // Not found
            res.status(404).render('error/404');
            break;
        case 500: // Internal server error
            const errorId = uuidv4(); // Generate a unique error ID
            console.error(`Internal server error:\nError ID: ${errorId}\n${err.message}\n${err.stack}`);
            res.status(500).render('error/500', { errorMessage: `Error ID: ${errorId}\n${err.message}` });
            break;
        case 502: // Bad gateway
            console.error(`Bad gateway: ${err.message}\n${err.stack}`);
            res.status(502).render('error/502');
        default:
            console.error(`An unhandled error occured - Error ${err.status}: ${err.message}\n${err.stack}`);
            res.status(err.status || 500).send(err.message);
            break;
    }
});

// Start the server
httpServer.listen(3000, () => console.log('Server started on port 3000'));