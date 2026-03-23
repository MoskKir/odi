import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBotStageContexts1710000000002 implements MigrationInterface {
  name = 'AddBotStageContexts1710000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bot_stage_contexts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "scenarioId" uuid NOT NULL,
        "stageName" varchar NOT NULL,
        "botConfigId" uuid NOT NULL,
        "roleDescription" text,
        "methodologicalTask" text,
        "tone" varchar,
        "triggers" text,
        "forbidden" text,
        "responseTemplates" jsonb,
        "fallbackBehavior" text,
        "active" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bot_stage_contexts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bot_stage_ctx" UNIQUE ("scenarioId", "stageName", "botConfigId"),
        CONSTRAINT "FK_bot_stage_ctx_scenario" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bot_stage_ctx_bot" FOREIGN KEY ("botConfigId") REFERENCES "bot_configs"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "stage_shared_contexts" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "scenarioId" uuid NOT NULL,
        "stageName" varchar NOT NULL,
        "purpose" text,
        "methodologicalTask" text,
        "keyConcepts" text,
        "criticalMoments" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_stage_shared_contexts" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stage_shared_ctx" UNIQUE ("scenarioId", "stageName"),
        CONSTRAINT "FK_stage_shared_ctx_scenario" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "stage_shared_contexts"`);
    await queryRunner.query(`DROP TABLE "bot_stage_contexts"`);
  }
}
