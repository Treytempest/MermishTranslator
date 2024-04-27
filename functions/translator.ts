import { getSheetData } from './sheetsHandler';

type WordData = { translation: string, partOfSpeech: string, definition: string };
type Dictionary = { [word: string]: WordData[] };

export class Translator {
  private englishDict: Dictionary;
  private mermishDict: Dictionary;
  private englishLetterDict: { [letter: string]: string };
  private mermishLetterDict: { [letter: string]: string };

  constructor() {
    this.englishDict = {};
    this.mermishDict = {};
    this.englishLetterDict = {};
    this.mermishLetterDict = {};
    this.initializeDictionaries();
  }

  private initializeDictionaries() {
    getSheetData().then((rows) => {
      rows.slice(1).forEach((row) => {
        if (row[3] && row[3][0] === '-') { // Row is a prefix
          // TODO: handle this
        } else if (row[3] && row[3][1] === '-') { // Row is a form 
          // TODO: handle this
        } else { // Row is a word
          var englishWord = row[3].toLowerCase();
          var mermishWord = row[0].toLowerCase();
          if (row[3]) { // The english word exists in the spreadsheet
            if (!this.englishDict[englishWord]) {
              // The word is not already in the dictionary, initialize it as an empty array
              this.englishDict[englishWord] = [];
            }
            this.englishDict[englishWord].push({
              translation: row[5],
              partOfSpeech: row[2],
              definition: row[4]
            });
          }
          if (row[0]) { // The mermish word exists in the spreadsheet
            if (!this.mermishDict[mermishWord]) {
              // The word is not already in the dictionary, initialize it as an empty array
              this.mermishDict[mermishWord] = [];
            }
            this.mermishDict[mermishWord].push({
              translation: row[3],
              partOfSpeech: row[2],
              definition: row[4]
            });
          }
        }
      });
    });
    this.englishLetterDict = {
      'a': 'ꯘ',
      'b': '꯹',
      'c': 'ꢟ',
      'd': 'ʓ',
      'e': 'ఒ',
      'f': 'ṿ',
      'g': '𐀁',
      'h': '។',
      'i': '𑄸',
      'j': '९',
      'k': 'ᶥꢟ',
      'l': 'թ',
      'm': 'キ',
      'n': 'ꥃ',
      'o': 'φ',
      'p': 'ઠ',
      'q': '꠵',
      'r': '𐍲',
      's': '𐠂',
      't': 'ψ',
      'u': 'ᨏ',
      'v': 'ᕕ',
      'w': 'ꯞ',
      'x': '𑜽',
      'y': 'ᝡ',
      'z': 'ꢢ',
      '?': '꡴',
      '!': '΅',
      ' ': '`',
      '.': '˝',
      '&': '𑑛',
      '’': 'ᐝ',
      "'": 'ᐝ',
    };
    this.mermishLetterDict = {
      'ꯘ': 'a',
      '꯹': 'b',
      'ꢟ': 'c',
      'ʓ': 'd',
      'ఒ': 'e',
      'ṿ': 'f',
      '𐀁': 'g',
      '។': 'h',
      '𑄸': 'i',
      '९': 'j',
      'թ': 'l',
      'キ': 'm',
      'ꥃ': 'n',
      'φ': 'o',
      'ઠ': 'p',
      '꠵': 'q',
      '𐍲': 'r',
      '𐠂': 's',
      'ψ': 't',
      'ᨏ': 'u',
      'ᕕ': 'v',
      'ꯞ': 'w',
      '𑜽': 'x',
      'ᝡ': 'y',
      'ꢢ': 'z',
      '꡴': '?',
      '΅': '!',
      '`': ' ',
      '˝': '.',
      '𑑛': '&',
      'ᐝ': "'",
    };
  }

  public translateWords(input: string, forward: boolean = true): string {
    let output: string = this.regExp(input, true);
    output = this.replaceWords(output, forward);
    return this.regExp(output, false);
  }

  private replaceWords(input: string, forward: boolean = true): string {
    // Split the input text into words and non-alphanumeric characters
    let words = input.split(/(\W+)/);
    let dict = forward ? this.englishDict : this.mermishDict;
    // For each word...
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      if (word.match(/\w+/)) { // If the word is alphanumeric
        // Get the base word

        // Get any prefixes

        // Check if the word is in dict (ignoring case) and retrieve all translations
        let translation = dict[word.toLowerCase()];
        let translatedWord = null;
        if (translation.length > 1) { // Multiple translations for this word
          //TODO: Handle this, for now just get the first translation
          for (let i = 0; i < translation.length; i++) {
            
          }
          translatedWord = translation[0].translation; 
        } else { // Only one translation, set word to that
          translatedWord = translation[0].translation; 
        }
        if (translatedWord) { // If a trnaslation was found
          // Preserve the original case
          if (word[0] === word[0].toUpperCase()) {
            translatedWord = translatedWord[0].toUpperCase() + translatedWord.slice(1);
          }
          // Translating forward, replace 'x' with appropriate letter
          if (forward) {
            // Replace 'x' with 'h' or 'g' in the translated word
            translatedWord = translatedWord.replace(/([^n])x/gi, '$1h').replace(/nx/gi, 'ng');
          }
          words[i] = translatedWord;
        }
      }
    }
    // Join the words back together into a single string
    return words.join('');
  }

  public translateSymbols(input: string, forward: boolean = true): string {
    let output: string = this.regExp(input, true);
    if (forward) {
      output = this.handleX(output, forward);
      output = this.handleDoubles(output, forward);
      output = this.replaceLetters(output, forward);
    } else {
      output = this.replaceLetters(output, forward);
      output = this.handleDoubles(output, forward);
      output = this.handleX(output, forward);
    }
    return this.regExp(output, false);
  }

  private handleDoubles(input: string, forward: boolean = true): string {
    if (forward) {
      const replacementChar: string = 'ᶥ';
      const pattern: RegExp = /(\w)\1/g;
      const evaluator = (match: string): string => replacementChar + match[1];
      input = input.replace(pattern, evaluator);
    }
    else {
      const pattern: RegExp = /ᶥ(\w)/g;
      const evaluator = (_: string, letter: string): string => {
      if (letter.toLowerCase() === 'c') {
        return '';
      } else {
        return letter + letter;
      }
      };
      input = input.replace(pattern, evaluator);
    }
    return input;
  }

  private handleX(input: string, forward: boolean = true): string {
    // Split the input text into words
    let words = input.split(' ');
    // For each word...
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      // Replace 'h' 'g' 'x' and '𑜽' with a wildcard character
      let pattern = word.replace(/(?<=n)g|[hx𑜽]/gi, '.');
      if (!/^[.]+$/.test(pattern)) { // If the pattern is not just wildcards
        // Create a regex pattern that matches the word
        let regex = new RegExp(`^${pattern}$`, 'gi');
        // Get all words that match the pattern
        let matchingWords = forward 
        ? Object.keys(this.englishDict).filter((word) => 
            this.englishDict[word].some(wordData => wordData.translation.match(regex))
          )
        : Object.keys(this.mermishDict).filter((value) => value.match(regex));
        if (matchingWords.length > 0) { // A matching word was found
          // Replace the word with its first matched version
          words[i] = matchingWords[0].toString();
        }
      }
    }
    return words.join(' ');
  }

  private replaceLetters(input: string, forward: boolean = true): string {
    let dict = {};
    if (!forward) { dict = this.mermishLetterDict; }
    else { dict = this.englishLetterDict; }
  
    let sb: string[] = [];
    let inputArray = Array.from(input); // Use Array.from to correctly handle surrogate pairs
  
    for (let c of inputArray) {
      let letter: string = c;
      if (forward) { 
        letter = c.toLowerCase(); 
      }
      if (dict.hasOwnProperty(letter)) {
        sb.push(dict[letter]);
      } else {
        sb.push(c);
      }
    }
    return sb.join('');
  }

  private regExp(text: string, escape: boolean = true): string {
    if (escape) {
      return text.replace(/[-[\]{}()*+?꡴.˝,\\^$|#]/g, '\\$&');
    } else{
      return text.replace(/\\([-[\]{}()*+?꡴.˝,\\^$|#])/g, '$1');
    }
  }
}