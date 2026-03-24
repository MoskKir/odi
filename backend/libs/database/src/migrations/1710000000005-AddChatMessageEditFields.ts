import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChatMessageEditFields1710000000005 implements MigrationInterface {
  name = 'AddChatMessageEditFields1710000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD COLUMN "isEdited" boolean NOT NULL DEFAULT false
    `);

    await queryRunner.query(`
      ALTER TABLE "chat_messages"
      ADD COLUMN "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "chat_messages" DROP COLUMN "updatedAt"
    `);
    await queryRunner.query(`
      ALTER TABLE "chat_messages" DROP COLUMN "isEdited"
    `);
  }
}
