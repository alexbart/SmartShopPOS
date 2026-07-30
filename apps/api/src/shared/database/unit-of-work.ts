import { getPrisma } from "./prisma.js";
import type { Prisma } from "@prisma/client";

export interface IUnitOfWork {
  execute<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T>;
}

export class UnitOfWork implements IUnitOfWork {
  async execute<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    const prisma = getPrisma();
    return prisma.$transaction(operation);
  }
}
