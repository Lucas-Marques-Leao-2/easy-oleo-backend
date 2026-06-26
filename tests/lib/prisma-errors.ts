import { Prisma } from "@prisma/client";

export function uniquePrismaError(target: string | string[]) {
  return new Prisma.PrismaClientKnownRequestError("Unique failed", {
    code: "P2002",
    clientVersion: "test",
    meta: { target },
  });
}
