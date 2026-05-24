# StudyTrack Mobil Backend - Teknik Özet

## Geliştirici

**Nisa Nur Akyıldız** — Mobil Backend Entegrasyonu (ASP.NET Core 8 + SQLite + Docker)

---

# StudyTrack Mobil Backend Teknik Mimari ve API Entegrasyon Listesi

## 1. Backend Genel Mimarisi

- **Framework:** ASP.NET Core 8 Web API — `[ApiController]` + `[Route("api/[controller]")]` attribute tabanlı yönlendirme
- **Veritabanı:** SQLite — `Entity Framework Core` ORM; `Data Source=study.db` bağlantı dizesi
- **ORM Migrasyonu:** Uygulama başlangıcında `db.Database.Migrate()` otomatik çalışır; şema değişiklikleri kodsuz uygulanır
- **Kimlik Doğrulama:** JWT Bearer Token — `Microsoft.IdentityModel.Tokens`, `HmacSha256` imzalama
- **API Dokümantasyonu:** Swagger UI — `/swagger` endpoint'i; Bearer token tanımı ile korumalı endpoint testi
- **Deployment:**
  - **Üretim:** Render.com — `https://studytrack-api-nu1x.onrender.com`
  - **Lokal Docker:** `http://10.132.200.196:10000` (fiziksel cihaz testi)
- **Sağlık Kontrolü:** `GET /health` — `200 OK { "status": "Healthy" }`; Docker healthcheck ve deployment probe için

---

## 2. Kimlik Doğrulama — Auth Endpoints

### 2.1 Kayıt Ol

```
POST /api/Auth/register
Content-Type: application/json
```

**İstek Gövdesi:**
```json
{
  "name": "Nisa Nur Akyıldız",
  "email": "nisa@example.com",
  "password": "123456"
}
```

**Başarılı Yanıt — 200 OK:**
```json
{
  "message": "Kayıt başarılı",
  "user": {
    "id": 1,
    "name": "Nisa Nur Akyıldız",
    "email": "nisa@example.com"
  }
}
```

**Hata Yanıtı — 400 Bad Request:**
```json
{ "message": "Bu email zaten kayıtlı" }
```

**Mobil Entegrasyon:** `apiRegister(name, email, password)` → başarılıysa Login ekranına yönlendirme; `globalError` banner'ına hata mesajı basılır.

---

### 2.2 Giriş Yap

```
POST /api/Auth/login
Content-Type: application/json
```

**İstek Gövdesi:**
```json
{
  "email": "nisa@example.com",
  "password": "123456"
}
```

**Başarılı Yanıt — 200 OK:**
```json
{
  "message": "Giriş başarılı",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Nisa Nur Akyıldız",
    "email": "nisa@example.com"
  }
}
```

**Hata Yanıtı — 401 Unauthorized:**
```json
{ "message": "Email veya şifre yanlış" }
```

**JWT Token İçeriği:**

| Claim | Değer |
|---|---|
| `ClaimTypes.NameIdentifier` | Kullanıcı ID (`user.Id`) |
| `ClaimTypes.Name` | Ad Soyad |
| `ClaimTypes.Email` | E-posta adresi |
| Geçerlilik Süresi | 1 saat (`DateTime.Now.AddHours(1)`) |
| İmza Algoritması | `HmacSha256` |

**Mobil Entegrasyon:** `{ token, user }` alınır → `AuthContext.login(token, user)` çağrılır → `AsyncStorage.setItem('token', ...)` ve `AsyncStorage.setItem('user', ...)` ile kalıcı saklama → `MainTabs`'a otomatik yönlendirme.

---

### 2.3 Çıkış Yap

```
POST /api/Auth/logout
```

**Başarılı Yanıt — 200 OK:**
```json
{ "message": "Çıkış yapıldı" }
```

**Not:** Stateless JWT mimarisinde sunucu tarafında token geçersizleştirme yapılmaz. Çıkış işlemi mobil tarafta `AsyncStorage.multiRemove(['token', 'user'])` ile gerçekleştirilir.

---

### 2.4 Profil Güncelle

```
PUT /api/Auth/profile
Authorization: Bearer <token>
Content-Type: application/json
```

**İstek Gövdesi:**
```json
{
  "name": "Nisa Nur",
  "email": "nisanur@example.com"
}
```

**Başarılı Yanıt — 200 OK:**
```json
{
  "message": "Profil güncellendi",
  "user": {
    "id": 1,
    "name": "Nisa Nur",
    "email": "nisanur@example.com"
  }
}
```

**Hata Yanıtları:**

| HTTP Kodu | Durum | Mesaj |
|---|---|---|
| `400` | Ad Soyad boş | `"Ad Soyad zorunludur."` |
| `400` | E-posta boş | `"E-posta zorunludur."` |
| `400` | E-posta kullanımda | `"Bu e-posta adresi başka bir hesapta kullanılıyor."` |
| `401` | Token geçersiz | `"Geçersiz token."` |
| `404` | Kullanıcı bulunamadı | `"Kullanıcı bulunamadı."` |

**Kimlik Doğrulama:** `[Authorize]` attribute → `User.FindFirst(ClaimTypes.NameIdentifier)?.Value` ile JWT'den kullanıcı ID'si okunur → veritabanından kullanıcı bulunur.

**Mobil Entegrasyon:** `api.put('/Auth/profile', { name, email })` → `res.data.user` ile `AuthContext.updateUser()` çağrılır → `AsyncStorage` ve context state aynı anda güncellenir.

---

## 3. Axios Interceptor ve Token Yönetimi

**Kaynak Dosya:** `studytrack-mobile/src/api/axios.js`

### İstek Interceptor'ı

Her API isteğinden önce `AsyncStorage`'dan token okunur ve `Authorization` header'ına eklenir:

```js
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### Yanıt Interceptor'ı — 401 Otomatik Logout

```js
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['token', 'user'])
      if (_onUnauthorized) _onUnauthorized()   // AuthContext logout tetikler
    }
    return Promise.reject(error)
  }
)
```

**`setUnauthorizedHandler(fn)` Pattern:** Döngüsel import sorunundan kaçınmak için `AuthContext` mount olduğunda logout fonksiyonunu modül seviyesinde kaydeder; token süresi dolduğunda veya geçersiz token geldiğinde uygulama otomatik çıkış yapar.

---

## 4. Plan CRUD — Plans Endpoints

Tüm endpoint'ler `[Authorize]` gerektirir. JWT token'dan kullanıcı ID'si okunarak yalnızca oturum açmış kullanıcının verileri döner.

### Planları Listele

```
GET /api/Plans
Authorization: Bearer <token>
```

**Yanıt — 200 OK:** Plan dizisi (kullanıcıya ait)

### Plan Oluştur

```
POST /api/Plans
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "Veri Yapıları Çalışma Planı",
  "description": "Ağaçlar ve graflar konularını kapsar",
  "startDate": "2026-05-24T00:00:00Z",
  "endDate": "2026-06-15T00:00:00Z",
  "status": "Active"
}
```

**Durum Değerleri:** `Active` | `Completed` | `Paused`

### Plan Güncelle

```
PUT /api/Plans/{id}
Authorization: Bearer <token>
```

### Plan Sil

```
DELETE /api/Plans/{id}
Authorization: Bearer <token>
```

**Yanıt — 204 No Content**

**Mobil Entegrasyon:** Her CRUD işlemi sonrası `fetchData()` çağrısı ile liste yenilenir. `Promise.allSettled` ile paralel API istekleri yapılır; bir endpoint başarısız olsa diğer veriler etkilenmez.

---

## 5. Goal CRUD — Goals Endpoints

### Hedefleri Listele

```
GET /api/Goals
Authorization: Bearer <token>
```

### Hedef Oluştur

```
POST /api/Goals
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "Algoritma Analizi Bitir",
  "targetHours": 20,
  "deadline": "2026-06-01T00:00:00Z",
  "isAchieved": false
}
```

### Hedef Güncelle

```
PUT /api/Goals/{id}
Authorization: Bearer <token>
```

### Hedef Sil

```
DELETE /api/Goals/{id}
Authorization: Bearer <token>
```

**`isAchieved` Toggle:** Hedef tamamlandığında `PUT /api/Goals/{id}` ile `isAchieved: true` gönderilir.

---

## 6. Task CRUD ve isCompleted Toggle — Tasks Endpoints

### Görevleri Listele

```
GET /api/Tasks
Authorization: Bearer <token>
```

**Yanıt Formatı Notu:** .NET JSON Serializer bazı durumlarda `{ "$values": [...] }` formatında dizi döner. Mobil tarafta `toArray(data)` yardımcı fonksiyonu her iki formatı normalize eder:

```js
const toArray = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.$values)) return data.$values
  return []
}
```

### Görev Oluştur

```
POST /api/Tasks
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "planId": 3,
  "title": "Binary Search Tree implementasyonu",
  "dueDate": "2026-05-30T00:00:00Z",
  "isCompleted": false
}
```

### Görev Güncelle

```
PUT /api/Tasks/{id}
Authorization: Bearer <token>
```

### Görev Tamamlama Toggle

Ayrı bir PATCH endpoint yoktur. Tamamlama durumu değişikliği `PUT /api/Tasks/{id}` ile `isCompleted` alanı ters çevrilerek yapılır:

```js
await api.put(`/Tasks/${task.id}`, {
  planId: task.planId,
  title: task.title,
  dueDate: task.dueDate,
  isCompleted: !task.isCompleted,   // toggle
})
```

### Görev Sil

```
DELETE /api/Tasks/{id}
Authorization: Bearer <token>
```

---

## 7. Dashboard ve Profil İstatistikleri

Dashboard ve Profil ekranları gerçek API verilerini `Promise.allSettled` ile eşzamanlı olarak çeker:

```js
const [pRes, gRes, tRes] = await Promise.allSettled([
  api.get('/Plans'),
  api.get('/Goals'),
  api.get('/Tasks'),
])
```

**Hesaplanan İstatistikler:**

| Metrik | Kaynak | Hesaplama |
|---|---|---|
| Toplam Plan | `GET /api/Plans` | `plans.length` |
| Toplam Hedef | `GET /api/Goals` | `goals.length` |
| Toplam Görev | `GET /api/Tasks` | `tasks.length` |
| Tamamlanan Görev | `GET /api/Tasks` | `tasks.filter(t => t.isCompleted).length` |
| Günlük Seri | `GET /api/Tasks` | `dueDate` proxy ile ardışık gün hesabı |
| Rozet Sayısı | Frontend | Eşik tabanlı `BADGE_DEFS` kontrolü |

**Hata Dayanıklılığı:** `Promise.allSettled` kullanımı sayesinde üç endpoint'ten biri başarısız olsa bile diğer veriler ekrana yansır; kısmi hata durumunda sayaç `0` gösterilir, uygulama çökmez.

---

## 8. JWT Güvenlik Katmanı

**Token Oluşturma (Backend):**

```csharp
var claims = new[] {
    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
    new Claim(ClaimTypes.Name, user.Name),
    new Claim(ClaimTypes.Email, user.Email)
};

var token = new JwtSecurityToken(
    issuer:   config["Jwt:Issuer"],
    audience: config["Jwt:Audience"],
    claims:   claims,
    expires:  DateTime.Now.AddHours(1),
    signingCredentials: new SigningCredentials(
        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"])),
        SecurityAlgorithms.HmacSha256)
);
```

**Token Doğrulama (Backend Middleware):**

```csharp
options.TokenValidationParameters = new TokenValidationParameters {
    ValidateIssuer           = true,
    ValidateAudience         = true,
    ValidateLifetime         = true,
    ValidateIssuerSigningKey = true,
    ValidIssuer              = config["Jwt:Issuer"],
    ValidAudience            = config["Jwt:Audience"],
    IssuerSigningKey         = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(config["Jwt:Key"]))
};
```

**Korumalı Endpoint'lerde Kullanıcı ID Okuma:**

```csharp
var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
if (!int.TryParse(userIdStr, out int userId))
    return Unauthorized(new { message = "Geçersiz token." });
```

---

## 9. CORS Politikası

Mobil Expo uygulaması fiziksel cihazdan eriştiğinde CORS engeline takılmaması için backend politikası şöyle yapılandırılmıştır:

```csharp
policy
  .SetIsOriginAllowed(origin =>
      origin.StartsWith("http://localhost:") ||
      origin.EndsWith(".vercel.app"))
  .AllowAnyHeader()
  .AllowAnyMethod()
  .AllowCredentials();
```

**Fiziksel Cihaz Notu:** React Native uygulaması tarayıcı değil native HTTP client kullandığından CORS politikası mobil istekleri etkilemez; kısıtlama yalnızca tarayıcı tabanlı web isteklerine uygulanır.

---

## 10. Docker Backend Entegrasyonu

### Container Mimarisi

```
docker-compose.yml
├── studytrack-api        (ASP.NET Core 8 + SQLite)
│   ├── Port:  10000:10000
│   ├── Volume: studydb:/data  → /data/study.db
│   └── Health: GET /health → 200 OK
└── studytrack-frontend   (React + Vite → nginx)
    └── Port:  3000:80
```

### Ortam Değişkenleri (Backend Container)

| Değişken | Değer |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Production` |
| `ASPNETCORE_URLS` | `http://+:10000` |
| `ConnectionStrings__DefaultConnection` | `Data Source=/data/study.db` |

### Healthcheck

```yaml
healthcheck:
  test: ["CMD-SHELL", "curl -sf http://localhost:10000/health || exit 1"]
  interval: 10s
  timeout: 5s
  retries: 8
  start_period: 30s
```

`curl` aspnet runtime image'ında varsayılan olarak bulunmadığından Dockerfile final stage'ine eklenmiştir:

```dockerfile
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
```

### Fiziksel Cihazdan Erişim

Expo Go uygulaması çalıştırılan fiziksel cihaz, Docker host makinesiyle aynı Wi-Fi ağında olmalıdır. `localhost` container içine erişemeyeceğinden host makinenin ağ IP adresi kullanılır:

```js
// studytrack-mobile/src/constants/index.js
export const API_BASE_URL = 'http://10.132.200.196:10000/api'
```

### Ortam Geçiş Tablosu

| Ortam | `API_BASE_URL` |
|---|---|
| Docker Lokal (cihaz testi) | `http://10.132.200.196:10000/api` |
| Render Üretim | `https://studytrack-api-nu1x.onrender.com/api` |

---

## 11. Veritabanı Şeması (SQLite)

### Users Tablosu

| Kolon | Tip | Kısıt |
|---|---|---|
| `Id` | `INTEGER` | PK, Auto-Increment |
| `Name` | `TEXT` | NOT NULL |
| `Email` | `TEXT` | NOT NULL, Unique |
| `Password` | `TEXT` | NOT NULL |

### Plans Tablosu

| Kolon | Tip | Açıklama |
|---|---|---|
| `Id` | `INTEGER` | PK |
| `UserId` | `INTEGER` | FK → Users |
| `Title` | `TEXT` | — |
| `Description` | `TEXT` | Opsiyonel |
| `StartDate` | `TEXT` | ISO 8601 |
| `EndDate` | `TEXT` | ISO 8601 |
| `Status` | `TEXT` | `Active` / `Completed` / `Paused` |

### Goals Tablosu

| Kolon | Tip | Açıklama |
|---|---|---|
| `Id` | `INTEGER` | PK |
| `UserId` | `INTEGER` | FK → Users |
| `Title` | `TEXT` | — |
| `TargetHours` | `INTEGER` | Çalışma saati hedefi |
| `Deadline` | `TEXT` | ISO 8601 |
| `IsAchieved` | `INTEGER` | `0` / `1` (Boolean) |

### Tasks Tablosu

| Kolon | Tip | Açıklama |
|---|---|---|
| `Id` | `INTEGER` | PK |
| `PlanId` | `INTEGER` | FK → Plans |
| `UserId` | `INTEGER` | FK → Users |
| `Title` | `TEXT` | — |
| `DueDate` | `TEXT` | ISO 8601 |
| `IsCompleted` | `INTEGER` | `0` / `1` (Boolean) |

---

## 12. Swagger UI — API Test Ortamı

- **Erişim:** `http://localhost:10000/swagger` (Docker) / `https://studytrack-api-nu1x.onrender.com/swagger` (Render)
- **Bearer Token Tanımı:** Swagger arayüzünde `Authorize` butonu ile JWT token girişi; korumalı endpoint'lerin UI üzerinden test edilmesi
- **Güvenlik Şeması:**

```csharp
options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme {
    Name        = "Authorization",
    Type        = SecuritySchemeType.Http,
    Scheme      = "bearer",
    BearerFormat = "JWT",
    In          = ParameterLocation.Header,
});
```

---

## 13. Endpoint Referans Tablosu

| Endpoint | Method | Auth | Açıklama |
|---|---|---|---|
| `/api/Auth/register` | POST | ❌ | Yeni kullanıcı kaydı |
| `/api/Auth/login` | POST | ❌ | Giriş → JWT token al |
| `/api/Auth/logout` | POST | ❌ | Çıkış (client-side) |
| `/api/Auth/profile` | PUT | ✅ | Ad/e-posta güncelle |
| `/api/Plans` | GET | ✅ | Plan listesi |
| `/api/Plans` | POST | ✅ | Yeni plan oluştur |
| `/api/Plans/{id}` | PUT | ✅ | Plan güncelle |
| `/api/Plans/{id}` | DELETE | ✅ | Plan sil |
| `/api/Goals` | GET | ✅ | Hedef listesi |
| `/api/Goals` | POST | ✅ | Yeni hedef oluştur |
| `/api/Goals/{id}` | PUT | ✅ | Hedef güncelle / tamamla |
| `/api/Goals/{id}` | DELETE | ✅ | Hedef sil |
| `/api/Tasks` | GET | ✅ | Görev listesi |
| `/api/Tasks` | POST | ✅ | Yeni görev oluştur |
| `/api/Tasks/{id}` | PUT | ✅ | Görev güncelle / toggle |
| `/api/Tasks/{id}` | DELETE | ✅ | Görev sil |
| `/health` | GET | ❌ | Sağlık kontrolü |

---

## Demo Video

> 📹 **Mobil Backend Kanıt Videosu**
>
> _Video bağlantısı buraya eklenecek._
>
> **Videoda gösterilecekler:**
> - Docker container'larının çalışır durumu (`docker ps` veya Docker Desktop)
> - `http://10.132.200.196:10000/swagger` Swagger UI açık — Bearer token ile giriş
> - Fiziksel cihazdan Expo Go üzerinden Login → JWT token alımı (Network sekmesi veya terminal log)
> - Plan / Hedef / Görev oluşturma ve listeleme isteklerinin backend log'unda görünmesi
> - `PUT /api/Auth/profile` çağrısı — yanıt `200 OK { "message": "Profil güncellendi" }`
> - Görev tamamlama toggle → `isCompleted: true` backend'e iletildi
> - `GET /health` → `200 OK { "status": "Healthy" }`
