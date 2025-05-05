
# Your rule content

-aşağıdaki endpointler kullanılıyor ve olmalıdır.


# Your rule content

- You can @ files here
- You can use markdown but dont have to
WaterApp API Dokümantasyonu

BASE URL: https://waterappdashboard2.onrender.com

1. KİMLİK DOĞRULAMA (AUTHENTICATION)

1.1. Kullanıcı Kaydı
POST /api/auth/register
İstek:
{
    "email": "string",
    "password": "string", // min 6 karakter
    "name": "string"
}
Yanıt:
{
    "userId": "string",
    "token": "string",
    "message": "Kayıt başarılı"
}

1.2. Kullanıcı Girişi
POST /api/auth/login
İstek:
{
    "email": "string",
    "password": "string"
}
Yanıt:
{
    "userId": "string",
    "token": "string",
    "name": "string"
}

1.3. Şifre Sıfırlama Talebi
POST /api/auth/forgot-password
İstek:
{
    "email": "string"
}
Yanıt:
{
    "message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"
}

1.4. Şifre Sıfırlama
POST /api/auth/reset-password
İstek:
{
    "token": "string",
    "newPassword": "string" // min 6 karakter
}
Yanıt:
{
    "message": "Şifre başarıyla güncellendi"
}

2. SU AYAK İZİ İŞLEMLERİ

2.1. Başlangıç Profili Oluşturma
POST /api/waterprint/initial-profile
Header: Authorization: Bearer {token}
İstek:
{
    "answers": [
        {
            "questionId": "string",
            "answer": "string",
            "isCorrect": "boolean"
        }
    ],
    "correctAnswersCount": "number",
    "initialWaterprint": "number" // ml cinsinden
}
Yanıt:
{
    "profileId": "string",
    "message": "Başlangıç profili oluşturuldu"
}

2.2. Su Ayak İzi Güncelleme
POST /api/waterprint/update
Header: Authorization: Bearer {token}
İstek:
{
    "currentWaterprint": "number", // ml cinsinden
    "taskId": "string",
    "waterprintReduction": "number" // ml cinsinden azalma miktarı
}
Yanıt:
{
    "newWaterprint": "number",
    "totalReduction": "number"
}

2.3. İlerleme Bilgisi Alma
GET /api/waterprint/progress/:userId
Header: Authorization: Bearer {token}
Yanıt:
{
    "initialWaterprint": "number",
    "currentWaterprint": "number",
    "waterprintReduction": "number",
    "correctAnswersCount": "number",
    "completedTasks": [
        {
            "taskId": "string",
            "waterprintReduction": "number",
            "completionDate": "timestamp"
        }
    ],
    "progressHistory": [
        {
            "date": "timestamp",
            "waterprint": "number"
        }
    ]
}

ÖNEMLİ NOTLAR:
1. Content-Type: application/json kullanılmalıdır
2. Authenticated endpointler için JWT token gereklidir:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
3. Tarihler ISO 8601 formatında: YYYY-MM-DDTHH:mm:ssZ
4. Su miktarları ml cinsinden gönderilmelidir
5. Hata yanıtı:
   {
       "error": "Hata mesajı",
       "status": 400
   }

TEST KULLANICILARI:
1. Email: blgnklc@gmail.com
   Password: 1234567
   Display Name: blgnklc@gmail.com

 
