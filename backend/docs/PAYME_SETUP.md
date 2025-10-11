# Настройка Payme Integration

## Проблема: "Банковский платежный интегратор [object Object]"

Если вы видите эту ошибку на странице Payme, это означает что Merchant ID не настроен правильно или не активирован в системе Payme.

## Причины ошибки

1. **Merchant ID не активирован** - ID существует, но аккаунт не прошел верификацию в Payme
2. **Неверный Merchant ID** - ID не существует в системе Payme
3. **Неверный формат параметров** - Параметры не соответствуют требованиям Payme API
4. **Тестовый режим** - Используется тестовый ID без настройки тестового окружения

## Как исправить

### Шаг 1: Проверьте Merchant ID

Откройте `backend/.env` и проверьте:
```bash
PAYME_MERCHANT_ID=65b78f9f3c319dec9d89218f  # Должен быть 24 символа
PAYME_SECRET_KEY=n1qqWene%o6TTaorOPyk3M#wiqqRuCbTJoZD
```

Merchant ID должен быть:
- Ровно 24 символа (проверяется автоматически)
- Получен от Payme после регистрации аккаунта
- Активирован в личном кабинете Payme

### Шаг 2: Зарегистрируйте аккаунт в Payme

1. Перейдите на https://business.paycom.uz
2. Зарегистрируйте бизнес-аккаунт
3. Пройдите верификацию (требуются документы компании)
4. После активации получите:
   - Merchant ID (24 символа)
   - Secret Key

### Шаг 3: Настройте callback URL в Payme

В личном кабинете Payme укажите:
```
Callback URL: https://apibilling.mycloud.uz/api/payments/payme/callback
```

### Шаг 4: Тестовый режим (для разработки)

Для тестирования без реальных платежей:

1. Используйте тестовый Merchant ID от Payme
2. Измените URL в `.env`:
```bash
PAYME_URL=https://test.paycom.uz  # Тестовый сервер
```

3. Используйте тестовые карты:
   - Карта: 8600 4954 0000 0031
   - Срок: 03/99
   - SMS код: 666666

### Шаг 5: Проверьте логи сервера

После создания платежа в консоли должны появиться логи:
```
💳 Creating Payme payment:
   Order ID: 14
   Amount: 65000 UZS (6500000 tiyin)
   Merchant ID: 65b78f9f3c319dec9d89218f (length: 24)
   Return URL: https://billing.mycloud.uz/payment-success
   ...
```

Если логи показывают ошибки - проверьте конфигурацию.

## Формат Payme URL

Правильный формат параметров:
```
m={merchant_id};ac.order_id={order_id};a={amount_in_tiyin};c={return_url}
```

Пример:
```
m=65b78f9f3c319dec9d89218f;ac.order_id=14;a=6500000;c=https://billing.mycloud.uz/payment-success
```

Эта строка кодируется в base64 и добавляется к URL:
```
https://checkout.paycom.uz/{base64_params}
```

## Контакты поддержки Payme

- Сайт: https://paycom.uz
- Техподдержка: support@paycom.uz
- Телефон: +998 78 150 00 00
- Telegram: @PaycomSupport

## Дополнительная информация

- [Документация Payme API](https://developer.help.paycom.uz)
- [Merchant API](https://developer.help.paycom.uz/metody-merchant-api)
- [Инициализация платежей](https://developer.help.paycom.uz/initsializatsiya-platezhey)

## Требования к сумме

- Минимум: 1 UZS (100 tiyin)
- Максимум: 999,999,999 UZS
- Точность: целые числа (округляются)

## Чеклист перед запуском в продакшн

- [ ] Аккаунт в Payme активирован и верифицирован
- [ ] Merchant ID и Secret Key установлены в `.env`
- [ ] Callback URL настроен в личном кабинете Payme
- [ ] Return URL указывает на ваш домен (не localhost)
- [ ] Проведен тестовый платеж
- [ ] Проверена работа callback (статус заказа меняется на "paid")
- [ ] Настроено логирование для отладки

---

**Примечание**: Merchant ID `65b78f9f3c319dec9d89218f` в `.env` - это тестовый ID. 
Для работы в продакшн необходимо получить реальный ID после регистрации и верификации в Payme.
