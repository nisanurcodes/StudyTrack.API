using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Study.API.Data;
using Study.API.DTOs;
using Study.API.Models;
using System.Security.Claims;

namespace Study.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class GoalsController : ControllerBase
    {
        private readonly AppDbContext _db;

        public GoalsController(AppDbContext db)
        {
            _db = db;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                throw new UnauthorizedAccessException("Kullanıcı kimliği bulunamadı.");
            }

            return int.Parse(userIdClaim);
        }

        [HttpGet]
        public async Task<IActionResult> GetAllGoals()
        {
            var currentUserId = GetCurrentUserId();

            var goals = await _db.Goals
                .Where(g => g.UserId == currentUserId)
                .ToListAsync();

            return Ok(goals);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetGoalById(int id)
        {
            var currentUserId = GetCurrentUserId();

            var goal = await _db.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == currentUserId);

            if (goal == null)
            {
                return NotFound(new { message = "Hedef bulunamadı" });
            }

            return Ok(goal);
        }

        [HttpPost]
        public async Task<IActionResult> CreateGoal([FromBody] GoalDto dto)
        {
            var currentUserId = GetCurrentUserId();

            var goal = new Goal
            {
                Title = dto.Title,
                TargetHours = dto.TargetHours,
                Deadline = dto.Deadline,
                IsAchieved = dto.IsAchieved,
                UserId = currentUserId
            };

            _db.Goals.Add(goal);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Hedef başarıyla oluşturuldu",
                goal = goal
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateGoal(int id, [FromBody] GoalDto dto)
        {
            var currentUserId = GetCurrentUserId();

            var goal = await _db.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == currentUserId);

            if (goal == null)
            {
                return NotFound(new { message = "Hedef bulunamadı" });
            }

            goal.Title = dto.Title;
            goal.TargetHours = dto.TargetHours;
            goal.Deadline = dto.Deadline;
            goal.IsAchieved = dto.IsAchieved;

            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Hedef güncellendi",
                goal = goal
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteGoal(int id)
        {
            var currentUserId = GetCurrentUserId();

            var goal = await _db.Goals
                .FirstOrDefaultAsync(g => g.Id == id && g.UserId == currentUserId);

            if (goal == null)
            {
                return NotFound(new { message = "Hedef bulunamadı" });
            }

            _db.Goals.Remove(goal);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Hedef silindi"
            });
        }
    }
}