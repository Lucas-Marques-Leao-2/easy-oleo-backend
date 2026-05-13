ALTER TABLE "User" ADD COLUMN "externalId" TEXT;

CREATE UNIQUE INDEX "User_externalId_key" ON "User"("externalId");
