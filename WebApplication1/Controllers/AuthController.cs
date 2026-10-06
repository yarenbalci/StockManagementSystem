using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using System.Security.Claims;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            string? connectionString = _configuration.GetConnectionString("DefaultConnection");

            using (SqlConnection connection = new SqlConnection(connectionString))
            {
                string query = "SELECT Username, Role FROM Users WHERE Username = @Username AND Password = @Password";

                using (SqlCommand command = new SqlCommand(query, connection))
                {
                    command.Parameters.AddWithValue("@Username", loginDto.Username ?? "");
                    command.Parameters.AddWithValue("@Password", loginDto.Password ?? "");

                    await connection.OpenAsync();
                    using (SqlDataReader reader = await command.ExecuteReaderAsync())
                    {
                        if (reader.Read())
                        {
                            string username = reader["Username"].ToString() ?? "";
                            string role = reader["Role"].ToString() ?? "";

                            // --- ÇEREZ OLUŞTURMA (LOGIN) ---
                            var claims = new List<Claim>
                            {
                                new Claim(ClaimTypes.Name, username),
                                new Claim(ClaimTypes.Role, role)
                            };

                            var claimsIdentity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
                            
                            await HttpContext.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(claimsIdentity));

                            return Ok(new
                            {
                                Message = "Giriş başarılı!",
                                Username = username,
                                Role = role
                            });
                        }
                    }
                }
            }

            return Unauthorized(new { Message = "Geçersiz kullanıcı adı veya şifre!" });
        }
    }

    public class LoginDto
    {
        public string? Username { get; set; }
        public string? Password { get; set; }
    }
}