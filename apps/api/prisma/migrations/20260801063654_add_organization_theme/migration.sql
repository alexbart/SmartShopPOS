-- CreateTable
CREATE TABLE "organization_themes" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "primaryColor" VARCHAR(7),
    "secondaryColor" VARCHAR(7),
    "accentColor" VARCHAR(7),
    "logoUrl" TEXT,
    "faviconUrl" TEXT,
    "themeMode" VARCHAR(20) DEFAULT 'light',
    "borderRadius" VARCHAR(20) DEFAULT '0.5rem',
    "fontFamily" VARCHAR(255),
    "compactMode" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "organization_themes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_themes_organizationId_key" ON "organization_themes"("organizationId");
