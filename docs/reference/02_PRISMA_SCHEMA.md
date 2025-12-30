# 02_PRISMA_SCHEMA.md

> Split from `developer_specifications.md`.

## Purpose
Defines database persistence for projects, versioning, and access control.

---

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  projects  ProjectMember[]
}

model Project {
  id             String   @id @default(cuid())
  name           String
  ownerId        String
  latestSnapshot Json
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  members        ProjectMember[]
  versions       ProjectVersion[]
}

model ProjectMember {
  projectId String
  userId    String
  role      ProjectRole

  project Project @relation(fields: [projectId], references: [id])
  user    User    @relation(fields: [userId], references: [id])

  @@id([projectId, userId])
}

model ProjectVersion {
  id        String   @id @default(cuid())
  projectId String
  snapshot  Json
  message   String?
  createdAt DateTime @default(now())

  project Project @relation(fields: [projectId], references: [id])
}

enum ProjectRole {
  OWNER
  EDITOR
  VIEWER
}
```

---
