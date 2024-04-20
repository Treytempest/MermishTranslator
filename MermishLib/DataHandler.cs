using NPOI.XSSF.UserModel;
using System.Text;

namespace MermishLib
{
    public static class DataHandler
    {
        public static bool TranslateFile(string filePath, int inCol, int outCol, int sheetIndex = 0)
        {
            Console.OutputEncoding = Encoding.Unicode;
            XSSFWorkbook workbook;

            using (FileStream file = new(filePath, FileMode.Open, FileAccess.Read))
            {
                workbook = new XSSFWorkbook(file);
            }

            var sheet = workbook.GetSheetAt(sheetIndex);

            for (int i = 0; i <= sheet.LastRowNum; i++)
            {
                var row = sheet.GetRow(i);

                if (row != null)
                {
                    // Read data from the first column
                    var cell = row.GetCell(inCol);
                    if (cell != null)
                    {
                        string? data = cell.ToString();
                        data ??= "";
                        Console.Write(data + " => ");

                        // Run your function on the data
                        string result = Translator.Translate(data);

                        // Write the result to the second column
                        cell = row.CreateCell(outCol);
                        cell.SetCellValue(result);
                        Console.Write(result + "\n");
                    }
                }
            }
            using (FileStream file = new(filePath, FileMode.Open, FileAccess.Write))
            {
                workbook.Write(file);
            }
            return true;
        }
    }

 }

/*
UserCredential credential;
string credPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "client_secret_606770875975-ret7pfpnr9abcm4v0s0u52r2q1e2rp2p.apps.googleusercontent.com.json");
GoogleCredential credential;
string[] Scopes = ["https://www.googleapis.com/auth/spreadsheets.readonly"];
using (var stream = new FileStream(credPath, FileMode.Open, FileAccess.Read))
{
credential = GoogleCredential.FromStream(stream).CreateScoped(Scopes);
}
var service = new SheetsService(new BaseClientService.Initializer()
{
HttpClientInitializer = credential,
ApplicationName = "MermishDataHandler",
});
string spreadsheetId = "1_pR5C1EetKRkoth2boD3CLl0prh_h1uiQAkunuhPY2U";
string range = "Modern_Mermish!A:A";
SpreadsheetsResource.ValuesResource.GetRequest request = service.Spreadsheets.Values.Get(spreadsheetId, range);
ValueRange response = request.Execute();
IList<IList<object>> values = response.Values;
StringBuilder sb = new();
foreach (var row in values) { sb.AppendLine(row[0].ToString()); }
File.WriteAllText("output.txt", sb.ToString());*/