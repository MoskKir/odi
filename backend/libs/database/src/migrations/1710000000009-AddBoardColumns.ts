import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoardColumns1710000000009 implements MigrationInterface {
  name = 'AddBoardColumns1710000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_sessions"
      ADD COLUMN "boardColumns" jsonb DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_sessions" DROP COLUMN "boardColumns"
    `);
  }
}
