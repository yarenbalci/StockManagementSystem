using Microsoft.EntityFrameworkCore;
using StockManagement.Data.Entities;
using StockManagement.Entities;

namespace StockManagementSystem.Data
{
    public class NorthwindContext : DbContext
    {
        public NorthwindContext(DbContextOptions<NorthwindContext> options) : base(options)
        {
        }

        public DbSet<Product> Products { get; set; } = null!;
        public DbSet<Category> Categories { get; set; } = null!;
        public DbSet<User> Users { get; set; } = null!; 
    }
}