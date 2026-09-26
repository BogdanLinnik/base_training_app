# Тренування

Вебзастосунок для планування та відстеження тренувань: тренер створює
тренування для себе або для інших користувачів, отримувач підтверджує їх,
виконує і вносить фактичні результати, обидва можуть коментувати.

Стек: Next.js (App Router) + Prisma + PostgreSQL + Auth.js (Google OAuth).
Деплой — Vercel (безкоштовний план: хостинг, Prisma Postgres, логи).

## Локальна розробка

Потрібні: Node.js 20+, Docker (для локальної Postgres).

```bash
npm install
docker compose up -d        # піднімає Postgres на localhost:5432
cp .env.example .env.local  # і .env.example -> .env (Prisma CLI читає .env)
npm run db:migrate          # застосовує міграції
npm run db:seed             # створює тестових користувачів/вправи
npm run dev
```

Відкрийте http://localhost:3000 і увійдіть через Google (потрібен
налаштований `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` — див. розділ нижче).

### Корисні команди

```bash
npm run lint     # ESLint
npx tsc --noEmit # перевірка типів
npm run test     # unit-тести (Vitest) — обчислення % виконання і статусів
npm run build    # продакшн-збірка
```

## Google OAuth Client ID

Потрібен для входу через Gmail — і локально, і в проді.

1. Відкрийте [Google Cloud Console](https://console.cloud.google.com/) →
   створіть новий проєкт (або оберіть існуючий).
2. **APIs & Services → OAuth consent screen**: оберіть тип "External",
   заповніть назву застосунку, свій email. Для приватного використання
   достатньо статусу "Testing" і додати себе/учасників у "Test users".
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - Authorized redirect URIs — додайте обидва:
     - `http://localhost:3000/api/auth/callback/google` (для локальної розробки)
     - `https://<ваш-домен-на-vercel>/api/auth/callback/google` (після деплою)
4. Скопіюйте **Client ID** і **Client Secret** — вони підуть у змінні
   `AUTH_GOOGLE_ID` і `AUTH_GOOGLE_SECRET`.

## Email-нотифікації

Ще не підключено. Вкладка «Налаштування» вже дозволяє заздалегідь обрати,
про які події отримувати листи (зміна статусу, нове тренування, новий
коментар) — налаштування зберігаються, але саму відправку листів ще не
реалізовано. Внутрішні нотифікації на вкладці «Нотифікації» працюють
незалежно від цього і не потребують додаткового налаштування.

## Деплой на Vercel

1. Заведіть git-репозиторій цього проєкту і запуште на GitHub (Vercel
   деплоїть із Git-репозиторію).
2. На [vercel.com](https://vercel.com) → **Add New → Project** → оберіть цей
   репозиторій.
3. **Storage → Marketplace → Prisma Postgres** (безкоштовний план) і
   підключіть до проєкту. Vercel автоматично створює env-змінні для
   з'єднання з БД — якщо на проєкті вже існує змінна `DATABASE_URL`, він
   префіксує всі три новостворені змінні (наприклад `DATABAS_POSTGRES_URL`,
   `DATABAS_DATABASE_URL`, `DATABAS_PRISMA_DATABASE_URL`), щоб уникнути
   конфлікту. `prisma/schema.prisma` у цьому проєкті вже налаштований на
   пряме (не-Accelerate) з'єднання під іменем `DATABAS_POSTGRES_URL` — якщо
   у вас вийшла інша назва, перевірте її в Project Settings → Environment
   Variables і за потреби поправте `url`/`directUrl` у схемі.
4. У Project Settings → Environment Variables додайте:
   - `AUTH_SECRET` — випадковий рядок (`node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`)
   - `AUTH_URL` — `https://<ваш-домен>.vercel.app`
   - `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` — з кроку вище
5. Перед першим релізом виконайте міграції проти продової БД:
   `npx prisma migrate deploy` (з локальної машини, з відповідною
   змінною з'єднання в оточенні, або через Vercel CLI / build-команду).
6. Деплойте — Vercel автоматично білдитиме й хоститиме застосунок, логи
   виконання (включно з server actions) доступні у вкладці **Logs** проєкту.

## Структура

- `prisma/schema.prisma` — модель даних (користувачі, вправи, тренування,
  фактичні результати, коментарі).
- `src/lib/trainings.ts` — статуси/теги тренувань і правила доступу
  (хто може редагувати/підтверджувати/змінювати статус).
- `src/lib/progress.ts` — розрахунок % виконання тренування та кольору.
- `src/app/actions/*` — server actions (мутації).
- `src/app/**/page.tsx` — сторінки (дашборд, вправи, тренування).
