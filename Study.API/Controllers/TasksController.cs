using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Study.API.Data;
using Study.API.DTOs;
using Study.API.Models;
using Study.API.Services;

namespace Study.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TasksController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ICacheService _cache;

        public TasksController(AppDbContext db, ICacheService cache)
        {
            _db = db;
            _cache = cache;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllTasks()
        {
            var tasks = await _db.Tasks.ToListAsync();
            return Ok(tasks);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var task = await _db.Tasks.FindAsync(id);

            if (task == null)
            {
                return NotFound(new { message = "Görev bulunamadı" });
            }

            return Ok(task);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] TaskDto dto)
        {
            var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == dto.PlanId);

            if (plan == null)
            {
                return BadRequest(new { message = "Geçerli bir plan seçmelisin" });
            }

            var task = new StudyTask
            {
                PlanId = dto.PlanId,
                Title = dto.Title,
                IsCompleted = dto.IsCompleted,
                DueDate = dto.DueDate
            };

            _db.Tasks.Add(task);
            await _db.SaveChangesAsync();

            await _cache.DeleteAsync($"dashboard_stats:{plan.UserId}");

            return Ok(new
            {
                message = "Görev oluşturuldu",
                task = task
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskDto dto)
        {
            var task = await _db.Tasks.FindAsync(id);

            if (task == null)
            {
                return NotFound(new { message = "Görev bulunamadı" });
            }

            var plan = await _db.Plans.FirstOrDefaultAsync(p => p.Id == dto.PlanId);

            if (plan == null)
            {
                return BadRequest(new { message = "Geçerli bir plan seçmelisin" });
            }

            task.Title = dto.Title;
            task.IsCompleted = dto.IsCompleted;
            task.DueDate = dto.DueDate;
            task.PlanId = dto.PlanId;

            await _db.SaveChangesAsync();

            await _cache.DeleteAsync($"dashboard_stats:{plan.UserId}");

            return Ok(new
            {
                message = "Görev güncellendi",
                task = task
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int id)
        {
            var task = await _db.Tasks.FindAsync(id);

            if (task == null)
            {
                return NotFound(new { message = "Görev bulunamadı" });
            }

            // Cache invalidation için planın sahibini önceden al
            var plan = await _db.Plans.FindAsync(task.PlanId);

            _db.Tasks.Remove(task);
            await _db.SaveChangesAsync();

            if (plan != null)
                await _cache.DeleteAsync($"dashboard_stats:{plan.UserId}");

            return Ok(new
            {
                message = "Görev silindi"
            });
        }
    }
}