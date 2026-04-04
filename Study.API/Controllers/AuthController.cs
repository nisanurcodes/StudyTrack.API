using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Study.API.Data;
using Study.API.DTOs;
using Study.API.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Study.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext db, IConfiguration configuration)
        {
            _db = db;
            _configuration = configuration;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var existingUser = await _db.Users.FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (existingUser != null)
            {
                return BadRequest(new { message = "Bu email zaten kayıtlı" });
            }

            var user = new User
            {
                Name = dto.Name,
                Email = dto.Email,
                Password = dto.Password
            };

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Kayıt başarılı",
                user = user
            });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x =>
                x.Email == dto.Email && x.Password == dto.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Email veya şifre yanlış" });
            }

            var jwtKey = _configuration["Jwt:Key"];
            Console.WriteLine("JWT KEY: " + jwtKey);
            Console.WriteLine("JWT KEY LENGTH: " + jwtKey?.Length);

            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                return StatusCode(500, new { message = "JWT Key bulunamadı." });
            }

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(1),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);

            return Ok(new
            {
                message = "Giriş başarılı",
                token = tokenString,
                user = user
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new
            {
                message = "Çıkış yapıldı"
            });
        }
    }
}