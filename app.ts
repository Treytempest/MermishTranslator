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

// #region Server setup
// Import required modules
require('dotenv').config({ path: './secrets.env' });

// Create a write stream for the log file
const logsDir = path.join(__dirname, '..', 'logs');
var log_file = adminFunctions.createLogPath(logsDir);
var log_writer = fs.createWriteStream(log_file, {flags : 'w'});

// Create Express app, HTTP server, and Socket.IO server
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Create Express session middleware
const expressSession = session({ secret: process.env.SECRET_KEY, resave: true, saveUninitialized: true });

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
var translator = new Translator();

// Configure Express app
app.set('trust proxy', true);
app.set('view engine', 'ejs'); // Set the view engine to ejs
app.set('views', path.join(__dirname, '..', 'views')); // Set the views directory

// Middleware to parse request bodies
io.use(sharedsession(expressSession, { autoSave: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession);
// #endregion

// #region Translator Page routes
app.get('/', function (req, res) {
    // Render the 'translator' view
    res.render('translator', { englishText: '', angloText: '', mermishText: '' });
});

app.post('/', function (req, res) {
    const lastUpdated = req.body.lastUpdated;
    let englishText = req.body.englishText;
    let angloText = req.body.angloText;
    let mermishText = req.body.mermishText;

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
        default:
            // Handle any other cases here
            break;
    }

    res.render('translator', { englishText: englishText, angloText: angloText, mermishText: mermishText });
});
// #endregion

// #region Admin Portal routes
app.get('/admin', function (req, res, err) {
    if (req.session.admin) {
        // If the user is logged in, render the admin features
        fs.readFile(log_file, 'utf8', function(err, data) {
            if (err) {
              console.error(err);
              res.status(500).send('An error occurred while reading the log file.');
            } else {
                res.render('admin', { showLoginForm: false, user: req.session.admin, logs: data });
            }
        });
    } else {
        // If the user is not logged in, render the login form within the admin page
        res.render('admin', { showLoginForm: true, error: err.message });
    }
});

app.post('/admin', async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    // Read the JSON file
    const admins = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'admins.json'), 'utf8'));

    // Check if the entered username exists in the JSON file
    const admin = admins.find(admin => admin.username === username);

    if (admin && await bcrypt.compare(password, admin.password)) {
        // If a match is found, set a session variable and reload the admin page
        console.log(`Admin ${admin.username} logged in from ${req.ip}`);
        req.session.admin = admin;
        res.redirect('/admin');
    } else {
        // If no match is found, reload the admin page with the login form and an error message
        // Pass an error variable set to 'Invalid credentials.'
        console.warn(`Failed login attempt from ${req.ip}`);
        res.render('admin', { showLoginForm: true, error: 'Invalid credentials' });
    }
});

app.get('/admin/*', (req, res, next) => {
    if (req.session.admin) {
        res.redirect('/admin');
    } else {
        next(createError(403,'Forbidden'));
    }
});

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
        res.redirect('/admin', { showLoginForm: true, error: 'Please log in to log out.' });
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
        log_writer.end();
        adminFunctions.clearLogs(logsDir);
        log_file = adminFunctions.createLogPath(logsDir);
        log_writer = fs.createWriteStream(log_file, {flags : 'w'});
    } else { next(createError(403,'Forbidden')); }
});

app.post('/admin/rebuild-dictionaries', async (req, res, next) => {
    if (req.session.admin) {
        await translator.initializeDictionaries();
        res.sendStatus(200);
    } else { next(createError(403,'Forbidden')); }

});
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
            console.error(`Internal server error: ${err.message}\n${err.stack}`);
            res.status(500).send(err.message);
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