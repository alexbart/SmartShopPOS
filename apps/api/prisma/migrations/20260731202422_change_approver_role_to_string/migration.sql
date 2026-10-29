/*
  Warnings:

  - You are about to drop the column `approverRoleId` on the `approval_rules` table. All the data in the column will be lost.
  - Added the required column `approverRole` to the `approval_rules` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "approval_rules_approverRoleId_idx";

-- AlterTable
ALTER TABLE "approval_rules" DROP COLUMN "approverRoleId",
ADD COLUMN     "approverRole" VARCHAR(100) NOT NULL;

-- CreateIndex
CREATE INDEX "approval_rules_approverRole_idx" ON "approval_rules"("approverRole");
