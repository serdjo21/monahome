-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "editorialImageAlt" TEXT,
ADD COLUMN     "editorialImagePath" TEXT,
ADD COLUMN     "editorialText" TEXT,
ADD COLUMN     "heroFocalX" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "heroFocalY" INTEGER NOT NULL DEFAULT 50,
ADD COLUMN     "heroImageAlt" TEXT,
ADD COLUMN     "heroImageMobilePath" TEXT,
ADD COLUMN     "heroImagePath" TEXT,
ADD COLUMN     "heroTheme" "SectionTheme" NOT NULL DEFAULT 'ESPRESO';
