# VPS Billing System Backend

🚀 **Professional VPS Billing System** с MariaDB интеграцией и импортом данных из Excel.

## 📋 Описание

Полнофункциональная система биллинга VPS серверов с:
- ✅ MariaDB база данных 
- ✅ Импорт данных из Excel (VPS-Price.xlsx)
- ✅ REST API для мобильного приложения
- ✅ Payme интеграция для платежей
- ✅ Управление пользователями и заказами
- ✅ Тестовые данные

## 🛠️ Технологии

- **Backend**: Node.js + Express.js
- **Database**: MariaDB 10.6+
- **Excel**: XLSX парсер
- **Payment**: Payme API
- **Security**: Helmet, CORS

## 📁 Структура проекта

```
backend/
├── api/
│   ├── auth/          # Авторизация пользователей
│   ├── orders/        # Управление заказами
│   ├── services/      # VPS планы и услуги
│   └── payments/      # Payme интеграция
├── core/
│   ├── db/           # Подключение к базе данных
│   ├── models/       # Модели данных
│   ├── utils/        # Утилиты
│   └── config/       # Конфигурация
├── scripts/          # Скрипты инициализации
│   ├── setup-database.js
│   ├── import-excel-data.js
│   ├── add-test-data.js
│   └── initialize-system.js
├── app.js           # Главный файл приложения
├── package.json
└── .env            # Переменные окружения
```

## ⚙️ Установка и настройка

### 1. Настройка базы данных

Обновите файл `.env` с вашими данными MariaDB:

```bash
# Database Configuration
DB_HOST=your_mariadb_server_ip
DB_PORT=3306
DB_USER=your_username
DB_PASS=your_password
DB_NAME=vps_billing
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Инициализация системы

Выполните полную инициализацию (создание БД + импорт данных + тестовые данные):

```bash
npm run init-system
```

Или выполните по частям:

```bash
# Только создание структуры БД
npm run setup-db

# Только импорт из Excel
npm run import-data

# Только тестовые данные
npm run add-test-data
```

### 4. Запуск сервера

```bash
# Продакшн
npm start

# Разработка (с автоперезагрузкой)
npm run dev
```

Сервер запустится на порту 5000: http://localhost:5000

## 🔗 API Endpoints

### VPS Планы
- `GET /api/vps` - Список всех VPS планов
- `GET /api/vps/:id` - Детали конкретного плана
- `GET /api/vps/providers/list` - Список провайдеров
- `GET /api/vps/regions/list` - Список регионов

### Заказы
- `GET /api/orders` - Список заказов
- `POST /api/orders` - Создание нового заказа
- `GET /api/orders/:id` - Детали заказа
- `PUT /api/orders/:id/status` - Обновление статуса заказа

### Платежи (Payme)
- `POST /api/payments/payme` - Создание платежа
- `POST /api/payments/payme/callback` - Callback от Payme
- `GET /api/payments/payme/status/:order_id` - Статус платежа

### Пользователи
- `GET /api/auth/users` - Список пользователей
- `POST /api/auth/users` - Создание пользователя
- `GET /api/auth/users/:id` - Детали пользователя
- `POST /api/auth/login` - Авторизация

## 🧪 Тестовые данные

Система автоматически создает тестовых пользователей:

| Username | Password | Email |
|----------|----------|-------|
| john_doe | password123 | john@example.com |
| jane_smith | password456 | jane@example.com |
| alex_dev | devpassword | alex@developer.com |
| maria_admin | adminpass | maria@admin.com |
| test_user | testpass | test@test.com |

## 📊 Примеры запросов

### Получить все VPS планы
```bash
curl -X GET "http://localhost:5000/api/vps"
```

### Создать заказ
```bash
curl -X POST "http://localhost:5000/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "vps_plan_id": 1,
    "notes": "Test order"
  }'
```

### Создать платеж через Payme
```bash
curl -X POST "http://localhost:5000/api/payments/payme" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": 1,
    "amount": 1999.00,
    "return_url": "http://localhost:3000/success"
  }'
```

### Авторизация
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john_doe",
    "password": "password123"
  }'
```

## 📈 Структура базы данных

### Основные таблицы:
- **providers** - Провайдеры VPS (Contabo, Hostinger, etc.)
- **regions** - Регионы размещения серверов
- **currencies** - Валюты (USD, UZS, RUB, EUR)
- **vps_plans** - VPS тарифные планы
- **users** - Пользователи системы
- **orders** - Заказы пользователей

## 🔧 Конфигурация

### Переменные окружения (.env):
```bash
# База данных
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=password
DB_NAME=vps_billing

# Сервер
PORT=5000
NODE_ENV=development

# Payme
PAYME_KEY=6073b258c9f58df72fa9f823
PAYME_TEST_KEY=6073b258c9f58df72fa9f823
PAYME_URL=https://checkout.test.paycom.uz

# Безопасность
JWT_SECRET=vps_billing_secret_key_2024
CORS_ORIGIN=*
```

## 🐛 Отладка

### Логи
Сервер выводит подробные логи:
- Подключение к базе данных
- HTTP запросы (Morgan)
- Ошибки API
- Payme callbacks

### Проверка подключения к БД
```bash
# Проверить подключение
node -e "require('./core/db/connection').connect().then(() => console.log('DB OK')).catch(console.error)"
```

## 🚀 Развертывание

### Systemd Service (Linux)
Создайте файл `/etc/systemd/system/vps-billing.service`:

```ini
[Unit]
Description=VPS Billing System
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/backend
ExecStart=/usr/bin/node app.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Nginx Proxy
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📝 Лицензия

MIT License - свободное использование для коммерческих и некоммерческих проектов.

## 👨‍💻 Автор

Senior Full-Stack Developer  
Система разработана как профессиональное решение для биллинга VPS услуг.

---

**🎯 Готово к использованию!** Система полностью настроена и готова к работе с реальными данными.