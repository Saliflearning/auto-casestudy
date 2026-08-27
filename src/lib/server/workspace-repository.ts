import { PrismaClient } from "@prisma/client";
import { upsertWithUniqueRaceRecovery } from "@/lib/server/unique-upsert";
import { WorkspaceSession } from "@/lib/server/workspace";

const globalForWorkspacePrisma = globalThis as unknown as {
  workspacePrisma?: PrismaClient;
};

function shouldUseDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function prisma() {
  if (!globalForWorkspacePrisma.workspacePrisma) {
    globalForWorkspacePrisma.workspacePrisma = new PrismaClient();
  }
  return globalForWorkspacePrisma.workspacePrisma;
}

export async function ensureWorkspaceMembership(session: WorkspaceSession) {
  if (!shouldUseDatabase()) {
    return {
      workspace: {
        id: session.workspaceId,
        name: "Auto-CaseStudy Workspace"
      },
      membership: {
        userId: session.userId,
        role: session.role
      }
    };
  }

  await upsertWithUniqueRaceRecovery(
    () =>
      prisma().user.upsert({
        where: { id: session.userId },
        update: {},
        create: {
          id: session.userId,
          name: "Auto-CaseStudy User"
        }
      }),
    () => prisma().user.findUniqueOrThrow({ where: { id: session.userId } })
  );
  const workspace = await upsertWithUniqueRaceRecovery(
    () =>
      prisma().workspace.upsert({
        where: { id: session.workspaceId },
        update: {},
        create: {
          id: session.workspaceId,
          name: "Auto-CaseStudy Workspace"
        }
      }),
    () => prisma().workspace.findUniqueOrThrow({ where: { id: session.workspaceId } })
  );
  const membership = await upsertWithUniqueRaceRecovery(
    () =>
      prisma().workspaceMember.upsert({
        where: {
          workspaceId_userId: {
            workspaceId: session.workspaceId,
            userId: session.userId
          }
        },
        update: {
          role: session.role
        },
        create: {
          id: `workspace_member_${session.workspaceId}_${session.userId}`,
          workspaceId: session.workspaceId,
          userId: session.userId,
          role: session.role
        }
      }),
    () =>
      prisma().workspaceMember.findUniqueOrThrow({
        where: {
          workspaceId_userId: {
            workspaceId: session.workspaceId,
            userId: session.userId
          }
        }
      })
  );

  return { workspace, membership };
}
