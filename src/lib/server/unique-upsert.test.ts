import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";

import { upsertWithUniqueRaceRecovery } from "@/lib/server/unique-upsert";

describe("upsertWithUniqueRaceRecovery", () => {
  it("reads the winning record when concurrent creation raises P2002", async () => {
    const existing = { id: "demo-workspace" };
    const conflict = new Prisma.PrismaClientKnownRequestError("Synthetic unique race", {
      code: "P2002",
      clientVersion: "5.22.0"
    });
    const findExisting = vi.fn().mockResolvedValue(existing);

    await expect(upsertWithUniqueRaceRecovery(vi.fn().mockRejectedValue(conflict), findExisting)).resolves.toEqual(existing);
    expect(findExisting).toHaveBeenCalledOnce();
  });

  it("does not hide unrelated database failures", async () => {
    const failure = new Error("Synthetic connection failure");
    const findExisting = vi.fn();

    await expect(upsertWithUniqueRaceRecovery(vi.fn().mockRejectedValue(failure), findExisting)).rejects.toBe(failure);
    expect(findExisting).not.toHaveBeenCalled();
  });
});
