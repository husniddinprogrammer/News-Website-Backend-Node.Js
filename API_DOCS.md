# News Portal API — Frontend Documentation

Base URL: `http://localhost:3000/api/v1`
Swagger UI: `http://localhost:3000/api-docs`

---

## Umumiy qoidalar

### Request Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>   ← (kerakli endpointlar uchun)
```

### Standart Response format
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { ... }
}
```

### Paginated Response format
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Error Response format
```json
{
  "success": false,
  "statusCode": 404,
  "message": "News not found"
}
```

### Validation Error format
```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation error",
  "errors": [
    { "field": "email", "message": "email must be a valid email" },
    { "field": "password", "message": "password must be at least 8 characters" }
  ]
}
```

### HTTP Status Codes
| Kod | Ma'no |
|-----|-------|
| 200 | OK |
| 201 | Yaratildi |
| 204 | Muvaffaqiyatli (content yo'q) |
| 400 | Noto'g'ri so'rov |
| 401 | Autentifikatsiya talab qilinadi |
| 403 | Ruxsat yo'q |
| 404 | Topilmadi |
| 409 | Conflict (duplikat) |
| 422 | Validatsiya xatosi |
| 429 | Ko'p so'rov yuborildi |
| 500 | Server xatosi |

---

## 🔐 AUTH

### POST `/auth/register` — Ro'yxatdan o'tish
**Auth:** Shart emas

**Request body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "Secret@123",
  "name": "John",
  "surname": "Doe",
  "role": "ADMIN"
}
```

**Qoidalar:**
- `username`: 3–30 belgi, faqat harf va raqam
- `password`: min 8 belgi, katta harf + kichik harf + raqam + maxsus belgi (`@$!%*?&`) bo'lishi shart
- `role`: `ADMIN` yoki `BOSS` (default: `ADMIN`)

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "ADMIN",
      "name": "John",
      "surname": "Doe",
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### POST `/auth/login` — Kirish
**Auth:** Shart emas

**Request body:**
```json
{
  "email": "john@example.com",
  "password": "Secret@123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "username": "johndoe",
      "email": "john@example.com",
      "role": "ADMIN",
      "name": "John",
      "surname": "Doe",
      "isBlocked": false,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

> **Frontend eslatmasi:** `accessToken` ni memory/state da saqlang (localStorage emas). `refreshToken` ni `httpOnly cookie` yoki `localStorage` da saqlang.

---

### POST `/auth/refresh` — Token yangilash
**Auth:** Shart emas

**Request body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Tokens refreshed",
  "data": {
    "user": { ... },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

> **Frontend eslatmasi:** `refreshToken` ham yangilanadi (rotation). Har safar yangi tokenni saqlang.

---

### POST `/auth/logout` — Chiqish
**Auth:** Bearer token talab qilinadi

**Request body:**
```json
{
  "refreshToken": "eyJ..."
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logged out successfully",
  "data": null
}
```

---

## 📰 NEWS

### GET `/news` — Yangiliklar ro'yxati
**Auth:** Shart emas (ADMIN/BOSS bo'lsa qo'shimcha filterlar ishlaydi)

**Query parameters:**

| Param | Type | Default | Tavsif |
|-------|------|---------|--------|
| `page` | number | 1 | Sahifa raqami |
| `limit` | number | 10 | Sahifadagi yozuvlar (max: 100) |
| `sort` | string | `id_desc` | Tartiblash (quyida) |
| `rank` | number | — | Rank bo'yicha filter (`0`–`10`) |
| `category` | string | — | Kategoriya slug'i |
| `hashtag` | string | — | Hashtag slug'i |
| `search` | string | — | Qidiruv (title + content) |
| `time` | string | — | Vaqt filtri (quyida) |
| `dateFrom` | date | — | Boshlang'ich sana (`YYYY-MM-DD`) |
| `dateTo` | date | — | Tugash sanasi (`YYYY-MM-DD`) |
| `status` | string | — | `DRAFT`/`PUBLISHED`/`DELETED` (faqat Admin) |

**`sort` qiymatlari:**
| Qiymat | Tavsif |
|--------|--------|
| `id_desc` | Eng yangi (default) |
| `id_asc` | Eng eski |
| `most_viewed` | Ko'p ko'rilgan (Redis cache'd!) |
| `most_liked` | Ko'p likelangan |
| `most_commented` | Ko'p izohli |
| `rank_desc` | Eng yuqori rank (`10` → `0`) |

**`time` qiymatlari:**
| Qiymat | Tavsif |
|--------|--------|
| `today` | Bugun |
| `this_week` | Shu hafta |
| `this_month` | Shu oy |

**Misol so'rovlar:**
```
GET /news
GET /news?page=2&limit=20
GET /news?sort=most_viewed
GET /news?category=technology&sort=most_liked
GET /news?hashtag=breaking&time=today
GET /news?search=sun+energy
GET /news?dateFrom=2024-01-01&dateTo=2024-06-30
GET /news?time=this_week&sort=most_commented
GET /news?sort=rank_desc
GET /news?sort=rank_desc&category=technology
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "title": "Breaking: New AI Model Released",
      "slug": "breaking-new-ai-model-released",
      "shortDescription": "Researchers unveil a groundbreaking AI model.",
      "status": "PUBLISHED",
      "viewCount": 1520,
      "rank": 8,
      "likeCount": 87,
      "commentCount": 23,
      "createdAt": "2024-06-01T10:00:00.000Z",
      "updatedAt": "2024-06-01T12:00:00.000Z",
      "category": {
        "id": "uuid",
        "name": "Technology",
        "slug": "technology"
      },
      "author": {
        "id": "uuid",
        "username": "admin",
        "name": "Admin",
        "surname": "User"
      },
      "images": [
        { "id": "uuid", "url": "/uploads/abc123.jpg" }
      ],
      "hashtags": [
        { "id": "uuid", "name": "AI", "slug": "ai" },
        { "id": "uuid", "name": "Technology", "slug": "technology" }
      ]
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "totalPages": 15
  }
}
```

> **Eslatma:** `content` (to'liq matn) faqat detail sahifada qaytadi, ro'yxatda yo'q.

---

### GET `/news/slug/:slug` — Yangilik detail (slug orqali)
**Auth:** Shart emas
> Ko'rilish hisoblagichi avtomatik oshadi (IP bo'yicha 60 daqiqada 1 marta)

**URL:** `GET /news/slug/breaking-new-ai-model-released`

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "id": "uuid",
    "title": "Breaking: New AI Model Released",
    "slug": "breaking-new-ai-model-released",
    "content": "To'liq maqola matni bu yerda...",
    "shortDescription": "Researchers unveil a groundbreaking AI model.",
    "status": "PUBLISHED",
    "viewCount": 1521,
    "rank": 8,
    "likeCount": 87,
    "commentCount": 23,
    "createdAt": "2024-06-01T10:00:00.000Z",
    "updatedAt": "2024-06-01T12:00:00.000Z",
    "category": {
      "id": "uuid",
      "name": "Technology",
      "slug": "technology"
    },
    "author": {
      "id": "uuid",
      "username": "admin",
      "name": "Admin",
      "surname": "User"
    },
    "images": [
      { "id": "uuid", "url": "/uploads/abc123.jpg" }
    ],
    "hashtags": [
      { "id": "uuid", "name": "AI", "slug": "ai" }
    ]
  }
}
```

---

### GET `/news/:id` — Yangilik detail (id orqali, Admin)
**Auth:** Bearer token (ADMIN yoki BOSS)

**URL:** `GET /news/uuid-here`

**Response:** Yuqoridagidek, lekin `DRAFT`/`DELETED` holatlar ham ko'rinadi.

---

### POST `/news` — Yangilik yaratish
**Auth:** Bearer token (ADMIN yoki BOSS)

**Request body:**
```json
{
  "title": "Breaking: New AI Model Released",
  "content": "To'liq maqola matni. Minimal 10 belgi bo'lishi kerak...",
  "shortDescription": "Qisqa tavsif. 10–500 belgi oralig'ida.",
  "categoryId": "category-uuid",
  "status": "DRAFT",
  "rank": 7,
  "hashtags": ["AI", "Technology", "Breaking"]
}
```

**Qoidalar:**
- `title`: 3–255 belgi
- `content`: min 10 belgi
- `shortDescription`: 10–500 belgi
- `status`: `DRAFT` (default) yoki `PUBLISHED`
- `rank`: `0`–`10` butun son (default: `0`) — tahririyat muhimlik darajasi
- `hashtags`: max 10 ta, har biri max 50 belgi

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "News created",
  "data": {
    "id": "uuid",
    "slug": "breaking-new-ai-model-released",
    ...
  }
}
```

> **Eslatma:** `slug` avtomatik `title` dan generatsiya qilinadi. Agar xuddi shunday slug mavjud bo'lsa, `-1`, `-2` qo'shiladi.

---

### PUT `/news/:id` — Yangilikni tahrirlash
**Auth:** Bearer token (ADMIN — faqat o'ziniki, BOSS — barchasi)

**Request body** (barcha fieldlar optional, lekin kamida 1 ta shart):
```json
{
  "title": "Yangilangan sarlavha",
  "content": "Yangilangan to'liq matn...",
  "shortDescription": "Yangilangan qisqa tavsif.",
  "categoryId": "new-category-uuid",
  "status": "PUBLISHED",
  "rank": 9,
  "hashtags": ["NewTag", "Updated"]
}
```

> **Eslatma:** `hashtags` berilsa, eskisi o'chirilib yangilari qo'yiladi.

**Response `200`:** To'liq yangilangan news objecti.

---

### DELETE `/news/:id` — Yangilikni o'chirish
**Auth:** Bearer token (ADMIN — faqat o'ziniki, BOSS — barchasi)

> Soft delete — `status` `DELETED` ga o'zgaradi, ma'lumotlar saqlanadi.

**Response `204`:** (body yo'q)

---

## 🗂️ CATEGORIES

### GET `/categories` — Barcha kategoriyalar
**Auth:** Shart emas

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "id": "uuid", "name": "Technology", "slug": "technology", "isDeleted": false },
    { "id": "uuid", "name": "Sports", "slug": "sports", "isDeleted": false }
  ]
}
```

---

### GET `/categories/:id` — Kategoriya detail
**Auth:** Shart emas

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { "id": "uuid", "name": "Technology", "slug": "technology", "isDeleted": false }
}
```

---

### POST `/categories` — Kategoriya yaratish
**Auth:** Bearer token (faqat BOSS)

**Request body:**
```json
{ "name": "Science" }
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Category created",
  "data": { "id": "uuid", "name": "Science", "slug": "science", "isDeleted": false }
}
```

---

### PUT `/categories/:id` — Kategoriyani tahrirlash
**Auth:** Bearer token (faqat BOSS)

**Request body:**
```json
{ "name": "Science & Nature" }
```

**Response `200`:** Yangilangan kategoriya objecti.

---

### DELETE `/categories/:id` — Kategoriyani o'chirish
**Auth:** Bearer token (faqat BOSS)
> Soft delete

**Response `204`:** (body yo'q)

---

## 💬 COMMENTS

### GET `/comments/news/:newsId` — Yangilik izohlari
**Auth:** Shart emas

**Query parameters:**
| Param | Default | Tavsif |
|-------|---------|--------|
| `page` | 1 | Sahifa |
| `limit` | 20 | Miqdor |

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "content": "Ajoyib maqola!",
      "username": "johndoe",
      "userId": "uuid",
      "createdAt": "2024-06-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 23,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### POST `/comments` — Izoh qoldirish
**Auth:** Bearer token (ADMIN yoki BOSS)

**Request body:**
```json
{
  "newsId": "news-uuid",
  "content": "Bu juda yaxshi maqola!"
}
```

**Qoidalar:**
- `content`: 1–2000 belgi

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Comment added",
  "data": {
    "id": "uuid",
    "newsId": "news-uuid",
    "content": "Bu juda yaxshi maqola!",
    "username": "johndoe",
    "createdAt": "2024-06-01T10:05:00.000Z"
  }
}
```

---

### DELETE `/comments/:id` — Izohni o'chirish
**Auth:** Bearer token (ADMIN — faqat o'ziniki, BOSS — barchasi)
> Soft delete

**Response `204`:** (body yo'q)

---

## ❤️ LIKES

### POST `/likes` — Like bosish / olib tashlash (toggle)
**Auth:** Ixtiyoriy (tizimga kirmagan foydalanuvchilar ham like bosa oladi)

> Bir xil IP yoki user tomonidan qayta like bosilsa — like o'chiriladi (toggle).

**Request body:**
```json
{
  "newsId": "news-uuid"
}
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Liked",
  "data": {
    "liked": true,
    "likeCount": 88
  }
}
```

Like olib tashlanganda:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Like removed",
  "data": {
    "liked": false,
    "likeCount": 87
  }
}
```

---

## #️⃣ HASHTAGS

### GET `/hashtags` — Barcha hashtaglar
**Auth:** Shart emas

**Query parameters:**
| Param | Default | Tavsif |
|-------|---------|--------|
| `page` | 1 | Sahifa |
| `limit` | 20 | Miqdor |
| `search` | — | Nomi bo'yicha qidiruv |

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "id": "uuid", "name": "Breaking", "slug": "breaking" },
    { "id": "uuid", "name": "Technology", "slug": "technology" }
  ],
  "pagination": { "total": 45, "page": 1, "limit": 20, "totalPages": 3 }
}
```

---

### POST `/hashtags` — Hashtag yaratish
**Auth:** Bearer token (faqat BOSS)

**Request body:**
```json
{ "name": "WorldNews" }
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Hashtag created",
  "data": { "id": "uuid", "name": "WorldNews", "slug": "worldnews" }
}
```

---

### DELETE `/hashtags/:id` — Hashtag o'chirish
**Auth:** Bearer token (faqat BOSS)

**Response `204`:** (body yo'q)

---

## 🖼️ IMAGES

### GET `/images/news/:newsId` — Yangilik rasmlari
**Auth:** Shart emas

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "id": "uuid", "newsId": "news-uuid", "url": "/uploads/abc123.jpg", "isDeleted": false }
  ]
}
```

> **Rasm URL:** `http://localhost:3000` + `/uploads/abc123.jpg`

---

### POST `/images/news/:newsId` — Rasm yuklash
**Auth:** Bearer token (ADMIN yoki BOSS)
**Content-Type:** `multipart/form-data`

**Form fields:**
- `images` — bir yoki bir nechta fayl (max 10 ta)

**Ruxsat etilgan formatlar:** `jpg`, `jpeg`, `png`, `webp`, `gif`
**Maksimal hajm:** 5 MB (bitta fayl)

**Axios misoli:**
```js
const formData = new FormData();
files.forEach(file => formData.append('images', file));

await axios.post(`/images/news/${newsId}`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${accessToken}`
  }
});
```

**Response `201`:**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Images uploaded",
  "data": [
    { "id": "uuid", "newsId": "news-uuid", "url": "/uploads/abc123.jpg", "isDeleted": false },
    { "id": "uuid", "newsId": "news-uuid", "url": "/uploads/def456.png", "isDeleted": false }
  ]
}
```

---

### DELETE `/images/:id` — Rasmni o'chirish
**Auth:** Bearer token (ADMIN — faqat o'ziniki, BOSS — barchasi)
> Soft delete

**Response `204`:** (body yo'q)

---

## 🔑 Autentifikatsiya — Frontend integratsiya

### Axios interceptor namunasi (JavaScript/TypeScript):

```js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
});

// Har so'rovga token qo'shish
api.interceptors.request.use((config) => {
  const token = getAccessToken(); // o'zingizning storage funksiyangiz
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 bo'lsa token yangilash
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post('/api/v1/auth/refresh', {
          refreshToken: getRefreshToken(),
        });
        saveTokens(data.data.accessToken, data.data.refreshToken);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        logout(); // refresh ham o'tsa — chiqish
      }
    }
    return Promise.reject(error);
  }
);
```

---

## ⚡ Rate Limiting

| Endpoint guruh | Cheklov |
|----------------|---------|
| Barcha API | 100 req / 15 daqiqa |
| `/auth/register`, `/auth/login` | 10 req / 15 daqiqa (IP bo'yicha) |
| `GET /news`, `/likes` | 60 req / daqiqa |

Cheklov oshilganda:
```json
{
  "success": false,
  "statusCode": 429,
  "message": "Too many requests, please try again later."
}
```

Response headerlarida qolgan miqdor ko'rsatiladi:
```
RateLimit-Limit: 100
RateLimit-Remaining: 0
RateLimit-Reset: 1717000000
```

---

## 👤 USERS

> Barcha `/users` endpointlari faqat **BOSS** role uchun.

---

### GET `/users` — Foydalanuvchilar ro'yxati

**Auth:** Bearer token (BOSS only)

**Query parameters:**

| Param | Default | Tavsif |
|-------|---------|--------|
| `page` | 1 | Sahifa |
| `limit` | 20 | Miqdor (max: 100) |
| `search` | — | Username, email yoki ism bo'yicha qidiruv |

**Misol so'rovlar:**
```
GET /users?limit=100
GET /users?page=1&limit=20
GET /users?search=husniddin
```

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "uuid",
      "username": "husniddin",
      "email": "admin@gmail.com",
      "role": "ADMIN",
      "name": "Husniddin",
      "surname": "Programmer",
      "isBlocked": false,
      "createdAt": "2024-06-01T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### PATCH `/users/:id/role` — Role o'zgartirish

**Auth:** Bearer token (BOSS only)

**Request body:**
```json
{
  "role": "BOSS"
}
```

**Qoidalar:**
- `role`: `ADMIN` yoki `BOSS`
- O'z rolini o'zgartirib bo'lmaydi (`400`)

**Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Role updated",
  "data": {
    "id": "uuid",
    "username": "husniddin",
    "email": "admin@gmail.com",
    "role": "BOSS",
    "name": "Husniddin",
    "surname": "Programmer",
    "isBlocked": false,
    "createdAt": "2024-06-01T10:00:00.000Z"
  }
}
```

---

### PATCH `/users/:id/block` — Block / Unblock

**Auth:** Bearer token (BOSS only)

**Request body:**
```json
{
  "isBlocked": true
}
```

**Qoidalar:**
- O'zini bloklab bo'lmaydi (`400`)
- BOSS roleli foydalanuvchini bloklab bo'lmaydi (`403`)

**Block qilish — Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User blocked",
  "data": {
    "id": "uuid",
    "username": "husniddin",
    "email": "admin@gmail.com",
    "role": "ADMIN",
    "isBlocked": true,
    "createdAt": "2024-06-01T10:00:00.000Z"
  }
}
```

**Unblock qilish — Response `200`:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "User unblocked",
  "data": {
    "id": "uuid",
    "isBlocked": false,
    ...
  }
}
```

---

## 🌐 Health Check

```
GET http://localhost:3000/health
```

```json
{
  "status": "ok",
  "timestamp": "2024-06-01T10:00:00.000Z",
  "env": "development"
}
```

---

## 📋 Endpointlar jadvali (xulosa)

| Method | Endpoint | Auth | Rol | Tavsif |
|--------|----------|------|-----|--------|
| POST | `/auth/register` | — | — | Ro'yxatdan o'tish |
| POST | `/auth/login` | — | — | Kirish |
| POST | `/auth/refresh` | — | — | Token yangilash |
| POST | `/auth/logout` | ✅ | any | Chiqish |
| GET | `/news` | — | — | Yangiliklar ro'yxati |
| GET | `/news/slug/:slug` | — | — | Yangilik detail |
| GET | `/news/:id` | ✅ | ADMIN/BOSS | Admin detail |
| POST | `/news` | ✅ | ADMIN/BOSS | Yaratish |
| PUT | `/news/:id` | ✅ | ADMIN/BOSS | Tahrirlash |
| DELETE | `/news/:id` | ✅ | ADMIN/BOSS | O'chirish |
| GET | `/categories` | — | — | Kategoriyalar |
| GET | `/categories/:id` | — | — | Kategoriya detail |
| POST | `/categories` | ✅ | BOSS | Yaratish |
| PUT | `/categories/:id` | ✅ | BOSS | Tahrirlash |
| DELETE | `/categories/:id` | ✅ | BOSS | O'chirish |
| GET | `/comments/news/:newsId` | — | — | Izohlar |
| POST | `/comments` | ✅ | any | Izoh qo'shish |
| DELETE | `/comments/:id` | ✅ | any | Izoh o'chirish |
| POST | `/likes` | — | — | Like toggle |
| GET | `/hashtags` | — | — | Hashtaglar |
| POST | `/hashtags` | ✅ | BOSS | Yaratish |
| DELETE | `/hashtags/:id` | ✅ | BOSS | O'chirish |
| GET | `/images/news/:newsId` | — | — | Rasmlar |
| POST | `/images/news/:newsId` | ✅ | ADMIN/BOSS | Yuklash |
| DELETE | `/images/:id` | ✅ | ADMIN/BOSS | O'chirish |
| GET | `/users` | ✅ | BOSS | Foydalanuvchilar ro'yxati |
| PATCH | `/users/:id/role` | ✅ | BOSS | Role o'zgartirish |
| PATCH | `/users/:id/block` | ✅ | BOSS | Block/unblock |
