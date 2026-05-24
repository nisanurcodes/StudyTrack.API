using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Study.API.Data;
using Study.API.Services;
using System.Security.Claims;
using System.Text.Json;

namespace Study.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class StatsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ICacheService _cache;

        public StatsController(AppDbContext db, ICacheService cache)
        {
            _db = db;
            _cache = cache;
        }

        // GET /api/Stats/dashboard
        // Cache-aside: Redis'te ara → yoksa DB'den çek → Redis'e yaz (60s TTL)
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId))
                return Unauthorized(new { message = "Geçersiz token." });

            var cacheKey = $"dashboard_stats:{userId}";

            // 1. Cache'i kontrol et
            var cached = await _cache.GetAsync(cacheKey);
            if (cached != null)
            {
                var cachedObj = JsonSerializer.Deserialize<object>(cached);
                return Ok(cachedObj);
            }

            // 2. DB'den hesapla
            var planIds = await _db.Plans
                .Where(p => p.UserId == userId)
                .Select(p => p.Id)
                .ToListAsync();

            var totalPlans = planIds.Count;
            var totalGoals = await _db.Goals.CountAsync(g => g.UserId == userId);
            var totalTasks = await _db.Tasks.CountAsync(t => planIds.Contains(t.PlanId));
            var completedTasks = await _db.Tasks.CountAsync(t => planIds.Contains(t.PlanId) && t.IsCompleted);

            var stats = new
            {
                totalPlans,
                totalGoals,
                totalTasks,
                completedTasks
            };

            // 3. Redis'e yaz (60 saniye TTL)
            var json = JsonSerializer.Serialize(stats);
            await _cache.SetAsync(cacheKey, json, TimeSpan.FromSeconds(60));

            return Ok(stats);
        }
    }
}
