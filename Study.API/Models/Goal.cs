using System.Text.Json.Serialization;

namespace Study.API.Models
{
    public class Goal
    {
        public int Id { get; set; }
        public int UserId { get; set; }

        public string Title { get; set; } = "";
        public int TargetHours { get; set; }
        public DateTime Deadline { get; set; }
        public bool IsAchieved { get; set; }

        [JsonIgnore]
        public User? User { get; set; }
    }
}