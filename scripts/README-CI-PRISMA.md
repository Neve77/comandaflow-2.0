# CI: executar migrations do Prisma

Este script ajuda a rodar `npx prisma migrate deploy` em runners de CI garantindo que a variável `DATABASE_URL` esteja definida. Os scripts já adicionados são:

- `scripts/ci-prisma-migrate.ps1` — PowerShell (Windows runners)
- `scripts/ci-prisma-migrate.sh` — POSIX shell (Linux/macOS runners)

Comportamento:
- Se `DATABASE_URL` já estiver definido no ambiente (por exemplo via secret), o valor é respeitado.
- Se não estiver definido, o script define `DATABASE_URL=file:./dev.db` por padrão.
- O script muda para a pasta `backend` e executa `npx prisma migrate deploy`.

Exemplos de uso no GitHub Actions

- Runner Linux/macOS (usa o shell script):

```yaml
- name: Run Prisma migrations
  run: bash ./scripts/ci-prisma-migrate.sh
```

- Runner Windows (PowerShell):

```yaml
- name: Run Prisma migrations
  shell: pwsh
  run: ./scripts/ci-prisma-migrate.ps1
```

Recomendações
- Prefer definir `DATABASE_URL` como secret no repositório (por exemplo `file:./dev.db` ou um DB acessível pelo runner). O script respeita esse valor e não o sobrescreve.
- Se o runner não precisar rodar migrations (ex.: testes isolados), pule este passo.
- Em produção, revise as migrations e backups antes de aplicar.
