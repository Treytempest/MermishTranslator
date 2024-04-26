import { getSheetData } from './sheetsHandler';

export class Translator {
  private englishDict: { [key: string]: string };
  private mermishDict: { [key: string]: string };
  private englishLDict: { [key: string]: string };
  private mermishLDict: { [key: string]: string };

  constructor() {
    this.englishDict = {};
    this.mermishDict = {};
    this.englishLDict = {};
    this.mermishLDict = {};
    this.initializeDictionaries();
  }

  private initializeDictionaries() {
    getSheetData().then((rows) => {
      rows.slice(1).forEach((row) => {
      if (row[3] && row[5] && !this.englishDict[row[3].toLowerCase()]) {
        this.englishDict[row[3].toLowerCase()] = row[5].toLowerCase();
      }
      if (row[0] && row[3] && !this.mermishDict[row[0].toLowerCase()]) {
        this.mermishDict[row[0].toLowerCase()] = row[3].toLowerCase();
      }
      });
    });
    this.englishLDict = {
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
    this.mermishLDict = {
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
    let output: string = input;
    output = this.replaceWords(output, forward);
    return output;
  }

  private replaceWords(input: string, forward: boolean = true): string {
    // Split the input text into words
    let words = input.split(' ');
    let dict = forward ? this.englishDict : this.mermishDict;
    // For each word...
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      // Check if the word is in dict (ignoring case)
      let translatedWord = dict[word.toLowerCase()];
      if (translatedWord) {
      // If the word is in dict, replace it with the translated word,
      // preserving the original case
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
    // Join the words back together into a single string
    return words.join(' ');
  }

  public translateSymbols(input: string, forward: boolean = true): string {
    let output: string = input;
    if (forward) {
      output = this.handleX(output, forward);
      output = this.handleDoubles(output, forward);
      output = this.replaceLetters(output, forward);
    } else {
      output = this.replaceLetters(output, forward);
      output = this.handleDoubles(output, forward);
      output = this.handleX(output, forward);
    }
    return output;
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
      if (!/^[.]+$/.test(pattern)) {
        let regex = new RegExp(`^${pattern}$`, 'gi');
        let matchingWords = forward ? Object.values(this.englishDict).filter((value) => value.match(regex)) : Object.keys(this.mermishDict).filter((value) => value.match(regex));
        if (matchingWords.length > 0) {
          // Replace the word with its matched version
          words[i] = matchingWords[0].toString();
        }
      }
    }
    return words.join(' ');
  }

  private replaceLetters(input: string, forward: boolean = true): string {
    let dict = {};
    if (!forward) { dict = this.mermishLDict; }
    else { dict = this.englishLDict; }
  
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
}