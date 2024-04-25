import express from 'express';
import path from 'path';
import { translator } from './functions/translator';

const app = express();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Set the views directory
app.set('views', path.join(__dirname, '..', 'views'));

// Use middleware to parse request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    // Render the 'translator' view
    res.render('translator', { englishText: '', mermishText: '' });
});

app.post('/', function (req, res) {
    // Your translation logic here
    const englishText = req.body.englishText;
    let mermishText = '';

    if (englishText) {
        mermishText = translator.translate(englishText); // Use your translation function
    }

    // Render the same view with the translated text
    res.render('translator', { englishText: englishText, mermishText: mermishText });
});

app.listen(3000, () => console.log('Server started on port 3000'));