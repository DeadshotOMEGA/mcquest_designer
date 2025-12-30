# 03_API_ENDPOINTS.md

> Split from `developer_specifications.md`.

## Core Endpoints

### Projects
- `POST /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`

### Versions
- `POST /api/projects/:id/versions`
- `GET /api/projects/:id/versions`
- `POST /api/projects/:id/versions/:versionId/restore`

### Export
- `POST /api/projects/:id/export?version=latest`

---
