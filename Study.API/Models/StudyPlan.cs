using Study.API.Models;

namespace Study.API.Models
{
    public class StudyPlan
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public string Status { get; set; } = "Active";

        public User? User { get; set; }
        public List<StudyTask> Tasks { get; set; } = new();
    }
}