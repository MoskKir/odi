import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotProvider1710000000010 implements MigrationInterface {
  name = 'AddBotProvider1710000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot_configs"
      ADD COLUMN "provider" varchar
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "bot_configs" DROP COLUMN "provider"
    `);
  }
}
