namespace Study.API.DTOs
{
    public class TaskDto
    {
        public int PlanId { get; set; }
        public string Title { get; set; } = "";
        public bool IsCompleted { get; set; }
        public DateTime DueDate { get; set; }
    }
}