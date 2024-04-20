using System;
using System.IO;
using System.Reflection.Metadata.Ecma335;
using System.Text;
using System.Text.RegularExpressions;
using MermishLib;

string filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Modern Mermish [Shaa-Tam'ej].xlsx");
Console.WriteLine(filePath);
DataHandler.TranslateFile(filePath, 5, 1);