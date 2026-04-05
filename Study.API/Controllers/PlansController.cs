using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Study.API.Data;
using Study.API.Models;
using Study.API.DTOs;
using System.Security.Claims;

namespace Study.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class PlansController : ControllerBase
    {
        private readonly AppDbContext _db;

        public PlansController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllPlans()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı" });
            }

            var userId = int.Parse(userIdClaim);

            var plans = await _db.Plans
                .Where(p => p.UserId == userId)
                .ToListAsync();

            return Ok(plans);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlanById(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı" });
            }

            var userId = int.Parse(userIdClaim);

            var plan = await _db.Plans
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (plan == null)
            {
                return NotFound(new { message = "Plan bulunamadı" });
            }

            return Ok(plan);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlan([FromBody] PlanDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı" });
            }

            var userId = int.Parse(userIdClaim);

            var plan = new StudyPlan
            {
                Title = dto.Title,
                Description = dto.Description,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Status = dto.Status,
                UserId = userId
            };

            _db.Plans.Add(plan);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Plan başarıyla oluşturuldu",
                plan = plan
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] PlanDto dto)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı" });
            }

            var userId = int.Parse(userIdClaim);

            var plan = await _db.Plans
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (plan == null)
            {
                return NotFound(new { message = "Plan bulunamadı" });
            }

            plan.Title = dto.Title;
            plan.Description = dto.Description;
            plan.StartDate = dto.StartDate;
            plan.EndDate = dto.EndDate;
            plan.Status = dto.Status;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Plan güncellendi",
                plan = plan
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePlan(int id)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { message = "Kullanıcı bilgisi alınamadı" });
            }

            var userId = int.Parse(userIdClaim);

            var plan = await _db.Plans
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (plan == null)
            {
                return NotFound(new { message = "Plan bulunamadı" });
            }

            _db.Plans.Remove(plan);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Plan silindi"
            });
        }
    }
}