import express from 'express';
import path from 'path';
import { Translator } from './functions/translator';

const app = express();

// Define your dictionary here
const translator = new Translator();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, '..', 'views'));

// Use middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.listen(3000, () => console.log('Server started on port 3000'));