# Backend source layout

- `app.js`: Express app composition and route mounting.
- `http/routes`: HTTP route definitions and request validation.
- `http/middleware`: HTTP middleware.
- `controllers`: Request handlers.
- `services`: Business rules and database operations.
- `infra/prisma`: Prisma client and seed entrypoint.
- `routes`, `middleware`, `prisma`: Compatibility wrappers for older imports.
