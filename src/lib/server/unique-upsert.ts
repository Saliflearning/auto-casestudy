import { Prisma } from "@prisma/client";

export async function upsertWithUniqueRaceRecovery<T>(upsert: () => Promise<T>, findExisting: () => Promise<T>) {
  try {
    return await upsert();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return findExisting();
    }
    throw error;
  }
}
