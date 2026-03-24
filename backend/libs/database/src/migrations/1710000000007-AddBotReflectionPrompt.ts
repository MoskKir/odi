import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotReflectionPrompt1710000000007 implements MigrationInterface {
  name = 'AddBotReflectionPrompt1710000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot_configs"
      ADD COLUMN "reflectionPrompt" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot_configs" DROP COLUMN "reflectionPrompt"
    `);
  }
}
