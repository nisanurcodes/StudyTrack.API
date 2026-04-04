using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Study.API.Data;
using Study.API.Models;

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
            var plans = await _db.Plans.ToListAsync();
            return Ok(plans);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlanById(int id)
        {
            var plan = await _db.Plans.FindAsync(id);

            if (plan == null)
            {
                return NotFound(new { message = "Plan bulunamadı" });
            }

            return Ok(plan);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePlan([FromBody] StudyPlan plan)
        {
            _db.Plans.Add(plan);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                message = "Plan başarıyla oluşturuldu",
                plan = plan
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePlan(int id, [FromBody] StudyPlan updatedPlan)
        {
            var plan = await _db.Plans.FindAsync(id);

            if (plan == null)
            {
                return NotFound(new { message = "Plan bulunamadı" });
            }

            plan.Title = updatedPlan.Title;
            plan.Description = updatedPlan.Description;
            plan.StartDate = updatedPlan.StartDate;
            plan.EndDate = updatedPlan.EndDate;
            plan.Status = updatedPlan.Status;

            // UserId burada değiştirilmesin
            // plan.UserId = updatedPlan.UserId;

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
            var plan = await _db.Plans.FindAsync(id);

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