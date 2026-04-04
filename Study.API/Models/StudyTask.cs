using System.Text.Json.Serialization;

namespace Study.API.Models
{
    public class StudyTask
    {
        public int Id { get; set; }
        public int PlanId { get; set; }

        public string Title { get; set; } = "";
        public bool IsCompleted { get; set; }
        public DateTime DueDate { get; set; }

        [JsonIgnore]
        public StudyPlan? StudyPlan { get; set; }
    }
}