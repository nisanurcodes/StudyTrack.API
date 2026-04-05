namespace Study.API.DTOs
{
    public class GoalDto
    {
        public string Title { get; set; } = "";
        public int TargetHours { get; set; }
        public DateTime Deadline { get; set; }
        public bool IsAchieved { get; set; }
    }
}