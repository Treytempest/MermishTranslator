using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using System.Text;
using System.Text.RegularExpressions;
using MermishLib;

namespace MermishTranslator.Pages
{
    public class IndexModel : PageModel
    {
        [BindProperty]
        public string? EnglishText { get; set; }
        public string? MermishText { get; set; }

        public void OnGet()
        {

        }
        
        public void OnPost()
        {
            if (EnglishText != null)
            {
                MermishText = Translator.Translate(EnglishText);
            }
            EnglishText = Request.Form["EnglishText"];
        }
    }
}
