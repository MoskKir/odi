import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCardOrderIndex1710000000004 implements MigrationInterface {
  name = 'AddCardOrderIndex1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "board_cards"
      ADD COLUMN "orderIndex" int NOT NULL DEFAULT 0
    `);

    // Set initial order based on creation time
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY "sessionId", "column" ORDER BY "createdAt") - 1 AS rn
        FROM "board_cards"
      )
      UPDATE "board_cards" SET "orderIndex" = ranked.rn
      FROM ranked WHERE "board_cards".id = ranked.id
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "board_cards" DROP COLUMN "orderIndex"
    `);
  }
}
