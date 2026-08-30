using FluentValidation;
using WebApplication1.DataTransferObject;

namespace WebApplication1.Validators
{
    public class CreateProductDtoValidator : AbstractValidator<CreateProductDto>
    {
        public CreateProductDtoValidator()
        {
            RuleFor(x => x.ProductName)
                .NotEmpty().WithMessage("Product name is required.")
                .MinimumLength(2).WithMessage("Product name must be at least 2 characters long.");

            RuleFor(x => x.UnitPrice)
                .GreaterThan(0).WithMessage("Unit price must be greater than 0.");

            RuleFor(x => x.UnitsInStock)
                .GreaterThanOrEqualTo((short)0).WithMessage("Units in stock cannot be negative.");
        }
    }
}