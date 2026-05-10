# СУТКИ. — лендинг студии

Студия молниеносной разработки. Лендинг за 1 день — от 12 000 ₽.

## Структура

```
sutki-landing/
├── index.html              # главная страница
├── styles.css              # стили
├── script.js               # анимации, форма, эффекты
├── api/
│   └── send.js             # Vercel-функция для Resend
├── netlify/
│   └── functions/
│       └── send.js         # Netlify-функция для Resend
├── netlify.toml            # конфиг Netlify (редирект /api/* → функция)
├── vercel.json
└── package.json
```

## Локальный запуск

```bash
npx serve .
```

Откройте http://localhost:3000.

## Деплой на Vercel

1. Залогиньтесь и подключите проект:
   ```bash
   npx vercel
   ```
2. В настройках проекта (Settings → Environment Variables) добавьте:
   - `RESEND_API_KEY` — ваш ключ от [resend.com](https://resend.com)
   - (опционально) `FROM_EMAIL` — например `СУТКИ. <noreply@yourdomain.ru>`. По умолчанию используется `onboarding@resend.dev` (тестовый адрес Resend, доставляет только на верифицированный аккаунт).
   - (опционально) `TO_EMAIL` — куда слать заявки. По умолчанию `emils99mail@gmail.com`.
3. После деплоя: `npx vercel --prod`.

## Resend — что важно

- Бесплатный тариф Resend: 100 писем в день, 3000 в месяц. Для лендинга студии этого с большим запасом.
- Чтобы письма шли с собственного домена, верифицируйте его в [Resend → Domains](https://resend.com/domains) и пропишите в `FROM_EMAIL`. Без верификации работает только адрес `onboarding@resend.dev`.

## Деплой на Netlify

Рядом с Vercel-функцией уже есть Netlify-версия. Можно деплоить как угодно — оба работают параллельно.

1. Залогиньтесь и подключите проект:
   ```bash
   npx netlify-cli deploy
   ```
   или просто перетащите папку проекта в [app.netlify.com](https://app.netlify.com) → «Add new site» → «Deploy manually».

2. В **Site settings → Environment variables** добавьте:
   - `RESEND_API_KEY` — ваш ключ
   - (опционально) `FROM_EMAIL`, `TO_EMAIL` — те же, что в Vercel-варианте.

3. Прод-деплой:
   ```bash
   npx netlify-cli deploy --prod
   ```

Что происходит «под капотом»:
- `netlify.toml` говорит «публикуй корень репозитория, функции лежат в `netlify/functions`».
- Редирект `/api/* → /.netlify/functions/:splat` в `netlify.toml` оставляет фронт без изменений — он по-прежнему POST-ит в `/api/send`, как и на Vercel.
- Сама функция написана в формате Netlify (`exports.handler = async (event) => …`), а не Vercel.

## Альтернативные деплои

- **Cloudflare Pages**: переложите в `functions/api/send.js` и адаптируйте под Workers Runtime (вместо `req/res` — `request` и `Response`).

## Контакты

- Telegram — [@mirabell](https://t.me/mirabell)
- Телефон — +7 999 111 08 66
- Почта — emils99mail@gmail.com
