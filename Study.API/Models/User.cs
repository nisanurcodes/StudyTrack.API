using Study.API.Models;

namespace Study.API.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string Password { get; set; } = "";

        public List<StudyPlan> StudyPlans { get; set; } = new();
        public List<Goal> Goals { get; set; } = new();
    }
}