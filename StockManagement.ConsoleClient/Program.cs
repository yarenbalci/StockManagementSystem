using System.Net.Http.Json;
using Newtonsoft.Json;
using StockManagement.ConsoleClient;

Console.WriteLine("=== STOCK MANAGEMENT CONSOLE CLIENT ===");
Console.WriteLine("Fetching products from API...\n");

using (HttpClient client = new HttpClient())
{
    client.BaseAddress = new Uri("https://localhost:7026/");

    try
    {
        HttpResponseMessage response = await client.GetAsync("api/products");

        if (response.IsSuccessStatusCode)
        {
            string jsonString = await response.Content.ReadAsStringAsync();

            var products = JsonConvert.DeserializeObject<List<ProductDto>>(jsonString);

            Console.WriteLine($"{"ID",-5} | {"Product Name",-30} | {"Price",-10} | {"Stock",-6} | {"Category"}");
            Console.WriteLine(new string('-', 75));

            if (products != null && products.Any())
            {
                foreach (var item in products)
                {
                    Console.WriteLine($"{item.ProductId,-5} | {item.ProductName,-30} | {item.UnitPrice,10:C2} | {item.UnitsInStock,6} | {item.CategoryName}");
                }
            }
            else
            {
                Console.WriteLine("No products found.");
            }
        }
        else
        {
            Console.WriteLine($"API Error: {response.StatusCode}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Connection Error: {ex.Message}");
    }
}

Console.WriteLine("\nOperation completed. Press any key to exit...");
Console.ReadKey();