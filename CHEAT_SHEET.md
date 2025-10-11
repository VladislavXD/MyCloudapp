# 📌 Шпаргалка по Payme

## 🚀 Быстрый тест (прямо сейчас!)

```bash
./TEST_NOW.sh 14 65000
```

Или вручную:
```bash
cd backend
node test-payme-callback.js 14 65000
```

## 🔧 Основная проблема

**Merchant ID не активирован в Payme!**

Текущий ID в `.env`:
```
65b78f9f3c319dec9d89218f
```

## ✅ Решение

### Вариант 1: Продакшн
1. https://business.paycom.uz
2. Зарегистрируйтесь
3. Получите Merchant ID
4. Обновите `backend/.env`

### Вариант 2: Тест
1. Email: support@paycom.uz
2. Запросите тестовый ID
3. Обновите `.env`:
   ```
   PAYME_URL=https://test.paycom.uz
   PAYME_MERCHANT_ID=test_id
   ```

## 📋 Что проверить в логах

При создании платежа должно быть:
```
💳 Creating Payme payment:
   Order ID: 14
   Amount: 65000 UZS (6500000 tiyin)
   Merchant ID: 65b78f9f3c319dec9d89218f (length: 24)

🔗 Payme Checkout URL Generated:
   Params: m=65b78f9f3c319dec9d89218f;ac.order_id=14;a=6500000;c=...
   Full URL: https://checkout.paycom.uz/...
```

## 📞 Контакты Payme

- Email: support@paycom.uz
- Telegram: @PaycomSupport
- Телефон: +998 78 150 00 00

## 📚 Документация

| Файл | Описание |
|------|----------|
| `QUICK_START.md` | Начните здесь |
| `PAYME_FIX.md` | Полное описание |
| `backend/docs/PAYME_SETUP.md` | Настройка |
| `backend/docs/PAYME_TESTING.md` | Тестирование |

## 🎯 Чеклист

- [ ] Запустите `./TEST_NOW.sh` - тест callback API
- [ ] Проверьте логи - они должны быть подробными
- [ ] Зарегистрируйтесь в Payme Business
- [ ] Получите реальный Merchant ID
- [ ] Обновите `backend/.env`
- [ ] Перезапустите сервер
- [ ] Создайте тестовый платеж
- [ ] Проверьте что страница Payme открывается БЕЗ ошибки

## 🐛 Отладка

**Ошибка "[object Object]":**
- Merchant ID не активирован
- Свяжитесь с Payme

**Callback не работает:**
```bash
node test-payme-callback.js 14 65000
```

**Логи не показываются:**
- Перезапустите сервер
- Проверьте консоль

---

**После настройки Merchant ID все заработает!** 🎉
