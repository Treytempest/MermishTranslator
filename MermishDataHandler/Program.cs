// See https://aka.ms/new-console-template for more information
using System;
Console.OutputEncoding = System.Text.Encoding.Unicode;
Console.WriteLine("Hello, World!");
Dictionary<char,char> letters = new Dictionary<char, char> { { 'a', 'ꯘ' } };
Console.WriteLine(letters['a']);
File.WriteAllText("test.txt", letters['a'].ToString());