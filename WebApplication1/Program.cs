using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using StockManagement.Data.Entities;
using WebApplication1;
using WebApplication1.Validators;


var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAutoMapper(typeof(MappingProfile));

builder.Services.AddDbContext<NorthwindContext>(options =>
    options.UseSqlServer("Server=LAPTOP-KSJPF05O;Database=Northwind;User Id=yaren;Password=[REDACTED];TrustServerCertificate=True;"));

builder.Services.AddControllers();

builder.Services.AddValidatorsFromAssemblyContaining<CreateProductDtoValidator>();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseDefaultFiles();
app.UseStaticFiles();

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();



app.Run();