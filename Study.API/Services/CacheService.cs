using StackExchange.Redis;

namespace Study.API.Services
{
    public class CacheService : ICacheService
    {
        private readonly IDatabase? _db;
        private readonly ILogger<CacheService> _logger;

        public CacheService(IConnectionMultiplexer multiplexer, ILogger<CacheService> logger)
        {
            _logger = logger;
            try
            {
                // multiplexer null! cast ile kaydedilmiş olabilir (Redis yoksa)
                if (multiplexer != null)
                    _db = multiplexer.GetDatabase();
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Redis veritabanı alınamadı: {Message}", ex.Message);
                _db = null;
            }
        }

        public async Task<string?> GetAsync(string key)
        {
            if (_db == null) return null;
            try
            {
                var value = await _db.StringGetAsync(key);
                return value.HasValue ? value.ToString() : null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Redis GET hatası [{Key}]: {Message}", key, ex.Message);
                return null;
            }
        }

        public async Task SetAsync(string key, string value, TimeSpan expiry)
        {
            if (_db == null) return;
            try
            {
                await _db.StringSetAsync(key, value, expiry);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Redis SET hatası [{Key}]: {Message}", key, ex.Message);
            }
        }

        public async Task DeleteAsync(string key)
        {
            if (_db == null) return;
            try
            {
                await _db.KeyDeleteAsync(key);
            }
            catch (Exception ex)
            {
                _logger.LogWarning("Redis DELETE hatası [{Key}]: {Message}", key, ex.Message);
            }
        }
    }
}
