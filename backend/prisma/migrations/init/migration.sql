-- CreateTable User
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable Bracelet
CREATE TABLE IF NOT EXISTS "Bracelet" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "number" TEXT NOT NULL UNIQUE,
    "status" TEXT NOT NULL DEFAULT 'livre',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable Comanda
CREATE TABLE IF NOT EXISTS "Comanda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "braceletId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "openedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    "total" DECIMAL NOT NULL DEFAULT '0',
    CONSTRAINT "Comanda_braceletId_fkey" FOREIGN KEY ("braceletId") REFERENCES "Bracelet" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable Pedido
CREATE TABLE IF NOT EXISTS "Pedido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "comandaId" TEXT NOT NULL,
    "produtoId" TEXT,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valorUnitario" DECIMAL NOT NULL,
    "subtotal" DECIMAL NOT NULL,
    "cancelado" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Pedido_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "Comanda" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Pedido_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "Produto" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable Produto
CREATE TABLE IF NOT EXISTS "Produto" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nome" TEXT NOT NULL,
    "preco" DECIMAL NOT NULL,
    "categoria" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Bracelet_number_key" ON "Bracelet"("number");
