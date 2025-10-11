# Тестирование Payme Integration

## Быстрый старт

### 1. Создайте тестовый заказ

Используйте API или фронтенд для создания заказа. Запомните `order_id`.

### 2. Запустите тест callback

```bash
cd backend
node test-payme-callback.js <order_id> <amount>
```

Пример:
```bash
node test-payme-callback.js 14 65000
```

### 3. Что тестируется

Скрипт симулирует полный цикл Payme платежа:

1. **CheckPerformTransaction** - Проверка возможности платежа
2. **CreateTransaction** - Создание транзакции
3. **CheckTransaction** - Проверка статуса транзакции
4. **PerformTransaction** - Завершение платежа

### 4. Ожидаемый результат

```
🚀 Payme Callback Test Suite
============================
Base URL: http://localhost:5000
Merchant ID: 65b78f9f3c319dec9d89218f
============================

Testing with Order ID: 14, Amount: 65000 UZS

🔍 Test 1: CheckPerformTransaction
Order ID: 14, Amount: 65000 UZS

✅ Response: {
  "result": {
    "allow": true,
    ...
  }
}

📝 Test 2: CreateTransaction
Order ID: 14, Amount: 65000 UZS

✅ Response: {
  "result": {
    "create_time": 1728648000000,
    "transaction": "14-1728648000000",
    "state": 1
  }
}

✅ All tests passed! Payment completed successfully.

You can now check order 14 status - it should be "paid" and "active".
```

### 5. Проверьте статус заказа

```bash
# Получите токен авторизации
TOKEN="your_jwt_token"

# Проверьте статус заказа
curl -X GET http://localhost:5000/api/orders/14 \
  -H "Authorization: Bearer $TOKEN"
```

Заказ должен иметь статус:
- `status: "active"`
- `payment_status: "paid"`
- `payment_method: "payme"`

## Тестирование на реальной странице Payme

### Для тестового окружения

1. Измените URL в `.env`:
```bash
PAYME_URL=https://test.paycom.uz
```

2. Получите тестовый Merchant ID от Payme

3. Используйте тестовые карты:
   - Номер: 8600 4954 0000 0031
   - Срок: 03/99
   - СМС код: 666666

### Для продакшн

1. Зарегистрируйтесь на https://business.paycom.uz
2. Получите реальный Merchant ID после верификации
3. Обновите `.env`:
```bash
PAYME_MERCHANT_ID=your_real_merchant_id
PAYME_SECRET_KEY=your_real_secret_key
PAYME_URL=https://checkout.paycom.uz
```

## Отладка ошибок

### Ошибка: "[object Object]" на странице Payme

**Причина**: Merchant ID не активирован или неверный

**Решение**:
1. Проверьте логи сервера - там будет детальная информация
2. Убедитесь что Merchant ID правильный (24 символа)
3. Убедитесь что аккаунт активирован в Payme
4. Используйте тестовое окружение для разработки

### Ошибка: "Authorization failed"

**Причина**: Неверный Secret Key

**Решение**:
```bash
# Проверьте в .env
PAYME_SECRET_KEY=correct_secret_key
```

### Ошибка: "Order not found"

**Причина**: Order ID не существует или уже оплачен

**Решение**:
1. Создайте новый заказ
2. Используйте правильный order_id в тесте

### Ошибка: "Invalid amount"

**Причина**: Сумма не совпадает с суммой заказа

**Решение**:
```bash
# Укажите правильную сумму
node test-payme-callback.js 14 65000  # 65000 UZS
```

## Логи

Все запросы к Payme callback логируются в консоли:

```
================================================================================
[2025-10-11T10:00:00.000Z] 💳 PAYME REQUEST: CheckPerformTransaction
{
  "method": "CheckPerformTransaction",
  "params": {
    "amount": 6500000,
    "account": {
      "order_id": "14"
    }
  }
}
================================================================================
```

Проверяйте логи для диагностики проблем.

## Дополнительно

- [Настройка Payme](./PAYME_SETUP.md)
- [Официальная документация Payme](https://developer.help.paycom.uz)
- [Merchant API методы](https://developer.help.paycom.uz/metody-merchant-api)
