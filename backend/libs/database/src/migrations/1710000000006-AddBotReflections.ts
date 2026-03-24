import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotReflections1710000000006 implements MigrationInterface {
  name = 'AddBotReflections1710000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bot_reflections" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "botConfigId" uuid NOT NULL,
        "prompt" text NOT NULL,
        "text" text NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bot_reflections" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_bot_reflections_sessionId" ON "bot_reflections" ("sessionId")
    `);

    await queryRunner.query(`
      ALTER TABLE "bot_reflections"
      ADD CONSTRAINT "FK_bot_reflections_session"
      FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE "bot_reflections"
      ADD CONSTRAINT "FK_bot_reflections_botConfig"
      FOREIGN KEY ("botConfigId") REFERENCES "bot_configs"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "bot_reflections"`);
  }
}
