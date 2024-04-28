require('dotenv').config({ path: './secrets.env' });
import fs from 'fs';
import util from 'util';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import bcrypt from 'bcrypt';
import session from 'express-session';
import sharedsession from 'express-socket.io-session';
import { Translator } from './functions/translator';
import * as adminFunctions from './functions/adminFunctions';

// Create a write stream for the log file
let date = new Date();
let timestamp = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}
const log_file = path.join(__dirname, '..', 'logs', `server-${timestamp}.log`);
let log_writer = fs.createWriteStream(log_file, {flags : 'w'});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const expressSession = session({ secret: process.env.SECRET_KEY, resave: true, saveUninitialized: true });

// Override console.log
let log_stdout = process.stdout;

console.log = function(d) {
  let timestamp = new Date().toLocaleString();
  let message = `[INFO] ${timestamp} - ${util.format(d)}`;
  log_writer.write(message + '\n');
  log_stdout.write(message + '\n');
  io.emit('log update', message);
};

// Override console.warn
console.warn = function(d) {
    let timestamp = new Date().toLocaleString();
    let message = `[WARN] ${timestamp} - ${util.format(d)}`;
    log_writer.write(message + '\n');
    log_stdout.write(message + '\n');
    io.emit('log update', message);
  };

// Override console.error
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
  });

// Define your dictionary here
const translator = new Translator();

app.set('trust proxy', true);

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, '..', 'views'));

// Use middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(expressSession);
io.use(sharedsession(expressSession, { autoSave: true }));
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
  });

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

app.get('/admin', function (req, res) {
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
        res.render('admin', { showLoginForm: true, error: null });
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

app.get('/admin/check-updates', async (req, res) => {
    const hasUpdates = await adminFunctions.checkForUpdates();
    res.json({ hasUpdates });
});

app.get('/admin/apply-updates', async (req, res) => {
    await adminFunctions.applyUpdates();
    res.sendStatus(200);
});

httpServer.listen(3000, () => console.log('Server started on port 3000'));