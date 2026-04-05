using Microsoft.EntityFrameworkCore;
using Study.API.Models;

namespace Study.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<StudyPlan> Plans { get; set; }
        public DbSet<StudyTask> Tasks { get; set; }
        public DbSet<Goal> Goals { get; set; }
    }
}