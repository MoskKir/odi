import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserPreferences1710000000001 implements MigrationInterface {
  name = 'AddUserPreferences1710000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "preferences" jsonb DEFAULT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "preferences"
    `);
  }
}
