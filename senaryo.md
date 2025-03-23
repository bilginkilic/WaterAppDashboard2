Bu WaterApp mobil uygulaması tarafından kullanılacaktır.
Api
ve WebApp kısımları bulunmaktadır.
Firebase kullanır.

Api hizmetinde
Login kısmı bulunmaktadır. email adı ve şifre ile giriş yapabilecektir.
Şifremi unuttum dediğinde şifresi mail adresine gelecektir.
Dil olarak react kullanılacaktır.

WaterApp uygulamasından, kullanıcıya özel bilgiler gelecektir.
Bu bilgiler  aşağıdaki gibidir.

# Su Ayak İzi Takip Sistemi API Senaryosu

## Kullanıcı İşlemleri (Authentication)

POST /api/auth/register
İstek:
{
    "email": "string",
    "password": "string",
    "name": "string"
}
Yanıt:
{
    "userId": "string",
    "token": "string",
    "message": "Kayıt başarılı"
}

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

POST /api/auth/forgot-password
İstek:
{
    "email": "string"
}
Yanıt:
{
    "message": "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi"
}

POST /api/auth/reset-password
İstek:
{
    "token": "string",
    "newPassword": "string"
}
Yanıt:
{
    "message": "Şifre başarıyla güncellendi"
}

## Su Ayak İzi İşlemleri

POST /api/waterprint/initial
İstek:
{
    "userId": "string",
    "initialWaterprint": "number",
    "answers": [
        {
            "questionId": "string",
            "answer": "string",
            "isCorrect": "boolean"
        }
    ],
    "correctAnswersCount": "number",
    "date": "timestamp"
}
Yanıt:
{
    "profileId": "string",
    "message": "Başlangıç profili oluşturuldu"
}

PUT /api/waterprint/update
İstek:
{
    "userId": "string",
    "currentWaterprint": "number",
    "taskId": "string",
    "waterprintReduction": "number"
}
Yanıt:
{
    "newWaterprint": "number",
    "totalReduction": "number"
}

GET /api/waterprint/progress/:userId
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

## Veritabanı Şeması

Users Collection:
{
    "id": "string",
    "email": "string",
    "password": "string (hashed)",
    "name": "string",
    "createdAt": "timestamp",
    "resetPasswordToken": "string",
    "resetPasswordExpires": "timestamp"
}

WaterprintProfiles Collection:
{
    "userId": "string",
    "initialWaterprint": "number",
    "currentWaterprint": "number",
    "initialAssessment": {
        "answers": [
            {
                "questionId": "string",
                "answer": "string",
                "isCorrect": "boolean"
            }
        ],
        "correctAnswersCount": "number",
        "date": "timestamp"
    },
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

## Kullanım Senaryoları

1. Kullanıcı Kaydı ve Giriş:
   - Kullanıcı kayıt olur (/api/auth/register)
   - Giriş yapar (/api/auth/login)
   - Şifresini unutursa sıfırlama talebi gönderir (/api/auth/forgot-password)

2. Başlangıç Değerlendirmesi:
   - Kullanıcı soruları yanıtlar
   - Sistem başlangıç su ayak izini hesaplar
   - Profil oluşturulur (/api/waterprint/initial)

3. Task Tamamlama ve İlerleme:
   - Kullanıcı task tamamlar
   - Su ayak izi güncellenir (/api/waterprint/update)
   - İlerleme kaydedilir

4. İlerleme Takibi:
   - Kullanıcı dashboard'da ilerlemesini görüntüler (/api/waterprint/progress/:userId)
   - Başlangıç vs. mevcut durum karşılaştırması
   - Tamamlanan taskların etkisi
   - Zaman içindeki değişim grafiği

## Güvenlik Önlemleri
- Tüm endpoint'ler JWT token doğrulaması gerektirir (login ve register hariç)
- Şifreler hash'lenerek saklanır
- Rate limiting uygulanır
- Input validation yapılır
- CORS politikaları uygulanır