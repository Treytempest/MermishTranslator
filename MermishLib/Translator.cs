using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace MermishLib
{
    public class Translator
    {
        public static string Translate(string input)
        {
            string output = input;
            output = RemoveDoubleLetters(output);
            output = ReplaceLetters(output);
            return output;
        }
        public static string RemoveDoubleLetters(string input)
        {
            char replacementChar = 'ᶥ';
            string pattern = @"(\w)\1";
            string evaluator(Match match) => replacementChar + match.Value[1].ToString();
            return Regex.Replace(input, pattern, evaluator);
        }
        public static string ReplaceLetters(string input)
        {
            Dictionary<string, string> letterDict = new()
        {
            { "a", "ꯘ" },
            { "b", "꯹" },
            { "c", "ꢟ" },
            { "d", "ʓ" },
            { "e", "ఒ" },
            { "f", "ṿ" },
            { "g", "𐀁" },
            { "h", "។" },
            { "i", "𑄸" },
            { "j", "९" },
            { "k", "ᶥꢟ" },
            { "l", "թ" },
            { "m", "キ" },
            { "n", "ꥃ" },
            { "o", "φ" },
            { "p", "ઠ" },
            { "q", "꠵" },
            { "r", "𐍲" },
            { "s", "𐠂" },
            { "t", "ψ" },
            { "u", "ᨏ" },
            { "v", "ᕕ" },
            { "w", "ꯞ" },
            { "x", "𑜽" },
            { "y", "ᝡ" },
            { "z", "ꢢ" },
            { "?", "꡴" },
            { "!", "΅" },
            { " ", " ̛" },
            { ".", "˝" },
            { "&", "𑑛" },
            { "'", "ᐝ" },
            { "’", "ᐝ" }
        };
            StringBuilder sb = new();
            foreach (char c in input)
            {
                string letter = c.ToString().ToLower();
                if (letterDict.TryGetValue(letter, out string? value))
                {
                    sb.Append(value);
                }
                else
                {
                    sb.Append(c);
                }
            }
            return sb.ToString();
        }
    }
}