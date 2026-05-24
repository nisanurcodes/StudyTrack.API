namespace Study.API.Services
{
    public interface ICacheService
    {
        Task<string?> GetAsync(string key);
        Task SetAsync(string key, string value, TimeSpan expiry);
        Task DeleteAsync(string key);
    }
}
