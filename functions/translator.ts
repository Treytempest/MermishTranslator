export class translator {
    public static translate(input: string): string {
      let output: string = input;
      output = translator.removeDoubleLetters(output);
      output = translator.replaceLetters(output);
      return output;
    }
  
    public static removeDoubleLetters(input: string): string {
      const replacementChar: string = 'ᶥ';
      const pattern: RegExp = /(\w)\1/g;
      const evaluator = (match: string): string => replacementChar + match[1];
      return input.replace(pattern, evaluator);
    }
  
    public static replaceLetters(input: string): string {
      const letterDict: { [key: string]: string } = {
        a: 'ꯘ',
        b: '꯹',
        c: 'ꢟ',
        d: 'ʓ',
        e: 'ఒ',
        f: 'ṿ',
        g: '𐀁',
        h: '។',
        i: '𑄸',
        j: '९',
        k: 'ᶥꢟ',
        l: 'թ',
        m: 'キ',
        n: 'ꥃ',
        o: 'φ',
        p: 'ઠ',
        q: '꠵',
        r: '𐍲',
        s: '𐠂',
        t: 'ψ',
        u: 'ᨏ',
        v: 'ᕕ',
        w: 'ꯞ',
        x: '𑜽',
        y: 'ᝡ',
        z: 'ꢢ',
        '?': '꡴',
        '!': '΅',
        ' ': ' ̛',
        '.': '˝',
        '&': '𑑛',
        "'": 'ᐝ',
        '’': 'ᐝ',
      };
  
      let sb: string[] = [];
      for (let c of input) {
        let letter: string = c.toLowerCase();
        if (letterDict.hasOwnProperty(letter)) {
          sb.push(letterDict[letter]);
        } else {
          sb.push(c);
        }
      }
      return sb.join('');
    }
  }