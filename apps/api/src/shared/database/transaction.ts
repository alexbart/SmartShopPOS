import { Prisma } from "@prisma/client";
import { getPrisma } from "./prisma.js";

export type TransactionClient = Prisma.TransactionClient;

export async function executeTransaction<T>(
  callback: (tx: TransactionClient) => Promise<T>
): Promise<T> {
  return getPrisma().$transaction(callback);
}
