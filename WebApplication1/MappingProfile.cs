using AutoMapper;
using StockManagement.Data.Entities;
using WebApplication1.DataTransferObject;

namespace WebApplication1
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Product, ProductDto>()
                .ForMember(dest => dest.CategoryName,
                           opt => opt.MapFrom(src => src.Category != null ? src.Category.CategoryName : null));

            CreateMap<CreateProductDto, Product>();

            CreateMap<ProductUpdateDto, Product>();
        }
    }
}