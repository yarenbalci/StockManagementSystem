using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using StockManagement.Data.Entities;
using WebApplication1.DataTransferObject;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly NorthwindContext _context;
        private readonly IMapper _mapper;

        public ProductsController(NorthwindContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string? categories,
            [FromQuery] decimal? minPrice,
            [FromQuery] decimal? maxPrice,
            [FromQuery] string? stockStatus)
        {
            var query = _context.Products.Include(p => p.Category).AsQueryable();

            if (!string.IsNullOrEmpty(categories))
            {
                var categoryIds = categories.Split(',')
                                            .Select(id => int.TryParse(id, out var parsed) ? parsed : (int?)null)
                                            .Where(id => id.HasValue)
                                            .Select(id => id!.Value)
                                            .ToList();

                query = query.Where(p => p.CategoryId.HasValue && categoryIds.Contains(p.CategoryId.Value));
            }

            if (minPrice.HasValue)
            {
                query = query.Where(p => p.UnitPrice >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(p => p.UnitPrice <= maxPrice.Value);
            }

            if (!string.IsNullOrEmpty(stockStatus))
            {
                var statuses = stockStatus.Split(',').ToList();

                query = query.Where(p =>
                    (statuses.Contains("inStock") && p.UnitsInStock >= 10) ||
                    (statuses.Contains("lowStock") && p.UnitsInStock > 0 && p.UnitsInStock < 10) ||
                    (statuses.Contains("outOfStock") && p.UnitsInStock == 0)
                );
            }

            var products = await query.ToListAsync();
            var productDtos = _mapper.Map<List<ProductDto>>(products);

            return Ok(productDtos);
        }

        // 2. GET CATEGORIES ENDPOINT (For JS /api/categories request)
        [HttpGet("/api/categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new
                {
                    categoryId = c.CategoryId,
                    categoryName = c.CategoryName
                })
                .ToListAsync();

            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProductById(int id)
        {
            var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null)
            {
                return NotFound();
            }

            var productDto = _mapper.Map<ProductDto>(product);
            return Ok(productDto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto)
        {
            if (dto == null)
            {
                return BadRequest();
            }

            var newProduct = _mapper.Map<Product>(dto);

            _context.Products.Add(newProduct);
            await _context.SaveChangesAsync();

            var resultDto = _mapper.Map<ProductDto>(newProduct);

            return CreatedAtAction(nameof(GetProductById), new { id = newProduct.ProductId }, resultDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductUpdateDto dto)
        {
            if (id != dto.ProductId)
            {
                return BadRequest("The ID in the URL does not match the ID in the requested body.");
            }

            var existingProduct = await _context.Products.FindAsync(id);
            if (existingProduct == null)
            {
                return NotFound("The product to update was not found.");
            }

            _mapper.Map(dto, existingProduct);

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Products.Any(p => p.ProductId == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok();
        }

        [HttpGet("critical-stock")]
        public async Task<IActionResult> GetCriticalStockProducts([FromQuery] int threshold = 20)
        {
            var criticalProducts = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.UnitsInStock <= threshold)
                .ToListAsync();

            var dtos = _mapper.Map<List<ProductDto>>(criticalProducts);
            return Ok(dtos);
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts([FromQuery] string name)
        {
            if (string.IsNullOrWhiteSpace(name))
            {
                return BadRequest();
            }

            var results = await _context.Products
                .Include(p => p.Category)
                .Where(p => p.ProductName.Contains(name))
                .ToListAsync();

            var dtos = _mapper.Map<List<ProductDto>>(results);
            return Ok(dtos);
        }
    }
}