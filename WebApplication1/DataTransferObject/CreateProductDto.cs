//POST
namespace WebApplication1.DataTransferObject
{
    public class CreateProductDto
    {
        public string ProductName { get; set; } = null!;
        public decimal? UnitPrice { get; set; }
        public short? UnitsInStock { get; set; }
        public int? CategoryId { get; set; }
    }
}