# DeployKit — Automated Web Application Deployment System

> ВКР: Проектирование и реализация системы автоматизированного развёртывания веб-приложения на основе Docker и Kubernetes

[![CI/CD](https://github.com/your-org/webapp/actions/workflows/ci-cd.yml/badge.svg)](https://github.com/your-org/webapp/actions)
test
---

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | React 18, React Router, Recharts |
| Backend | Node.js 20, Express 4, JWT Auth |
| База данных | PostgreSQL 15 |
| Контейнеризация | Docker 24, Docker Compose |
| Оркестрация | Kubernetes 1.28 |
| CI/CD | GitHub Actions |
| Тестирование | Jest, Supertest, React Testing Library |

---

## Структура проекта

```
webapp/
├── backend/              # Node.js REST API
│   ├── src/
│   │   ├── middleware/   # Auth middleware
│   │   ├── routes/       # API endpoints
│   │   ├── db.js         # PostgreSQL connection
│   │   ├── logger.js     # Winston logger
│   │   └── server.js     # Express app
│   ├── tests/            # Jest tests
│   ├── Dockerfile
│   └── package.json
├── frontend/             # React SPA
│   ├── src/
│   │   ├── components/   # Shared components
│   │   ├── hooks/        # Auth context
│   │   ├── pages/        # Dashboard, Tasks, Deployments
│   │   └── utils/        # API client
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── k8s/                  # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap-secret.yaml
│   ├── postgres.yaml     # StatefulSet + PVC
│   ├── backend.yaml      # Deployment + HPA
│   └── frontend.yaml     # Deployment + Ingress
├── .github/workflows/
│   └── ci-cd.yml         # GitHub Actions pipeline
└── docker-compose.yml    # Local development
```

---

## Быстрый старт (Docker Compose)

```bash
# 1. Клонировать репозиторий
git clone https://github.com/your-org/webapp.git
cd webapp

# 2. Запустить все сервисы
docker compose up -d

# 3. Открыть браузер
open http://localhost:3000
```

Приложение доступно:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health check**: http://localhost:5000/health

---

## Запуск тестов

```bash
# Backend тесты
cd backend && npm install && npm test

# Frontend тесты
cd frontend && npm install && npm test

# Через Docker
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

---

## Развёртывание в Kubernetes

```bash
# 1. Создать namespace
kubectl apply -f k8s/namespace.yaml

# 2. Применить конфигурацию и секреты
kubectl apply -f k8s/configmap-secret.yaml

# 3. Развернуть базу данных
kubectl apply -f k8s/postgres.yaml

# 4. Дождаться готовности БД
kubectl wait --for=condition=ready pod -l app=postgres -n webapp --timeout=60s

# 5. Развернуть backend
kubectl apply -f k8s/backend.yaml

# 6. Развернуть frontend
kubectl apply -f k8s/frontend.yaml

# 7. Проверить статус
kubectl get all -n webapp
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Регистрация |
| POST | `/api/auth/login` | Вход |
| GET | `/api/auth/me` | Текущий пользователь |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Список задач |
| POST | `/api/tasks` | Создать задачу |
| PUT | `/api/tasks/:id` | Обновить задачу |
| DELETE | `/api/tasks/:id` | Удалить задачу |
| GET | `/api/tasks/stats` | Статистика |

### Deployments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/deployments` | История деплоев |
| POST | `/api/deployments` | Запустить деплой (admin) |
| GET | `/api/deployments/:id` | Детали деплоя |

---

## Архитектура

```
Developer → git push → GitHub Actions
                           │
                    ┌──────┴──────┐
                    │ Test & Build │
                    └──────┬──────┘
                           │
                    Docker Registry
                           │
                    kubectl apply
                           │
           ┌───────────────┼───────────────┐
           │               │               │
     Frontend Pod     Backend Pod     PostgreSQL
     (nginx × 2)    (Node.js × 3)   (StatefulSet)
           │               │               │
           └───────────────┴───────────────┘
                    Kubernetes Ingress
                           │
                        Internet
```

---

## Переменные окружения

### Backend
| Переменная | Описание | По умолчанию |
|-----------|----------|-------------|
| `DB_HOST` | Хост PostgreSQL | `localhost` |
| `DB_PORT` | Порт PostgreSQL | `5432` |
| `JWT_SECRET` | Секрет JWT | ⚠️ обязательно изменить |
| `PORT` | Порт сервера | `5000` |

---

## Лицензия

MIT — ВКР 2025
