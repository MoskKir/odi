import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddInviteCode1710000000003 implements MigrationInterface {
  name = 'AddInviteCode1710000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_sessions"
      ADD COLUMN "inviteCode" varchar(8)
    `);

    // Generate invite codes for existing sessions
    await queryRunner.query(`
      UPDATE "game_sessions"
      SET "inviteCode" = UPPER(SUBSTR(MD5(RANDOM()::TEXT), 1, 6))
      WHERE "inviteCode" IS NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions"
      ALTER COLUMN "inviteCode" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "game_sessions"
      ADD CONSTRAINT "UQ_game_sessions_inviteCode" UNIQUE ("inviteCode")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "game_sessions"
      DROP CONSTRAINT "UQ_game_sessions_inviteCode"
    `);
    await queryRunner.query(`
      ALTER TABLE "game_sessions"
      DROP COLUMN "inviteCode"
    `);
  }
}
