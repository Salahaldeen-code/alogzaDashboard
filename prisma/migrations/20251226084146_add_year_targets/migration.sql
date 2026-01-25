-- CreateTable
CREATE TABLE "year_targets" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "minimum_amount" DECIMAL(10,2) NOT NULL,
    "actual_amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "maximum_amount" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "year_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "year_targets_year_key" ON "year_targets"("year");

-- CreateIndex
CREATE INDEX "idx_year_targets_year" ON "year_targets"("year");
