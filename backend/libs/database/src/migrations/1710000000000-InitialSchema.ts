import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1710000000000 implements MigrationInterface {
  name = 'InitialSchema1710000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM ('admin', 'moderator', 'user')
    `);

    await queryRunner.query(`
      CREATE TYPE "game_status_enum" AS ENUM ('draft', 'active', 'paused', 'completed')
    `);

    await queryRunner.query(`
      CREATE TYPE "phase_status_enum" AS ENUM ('pending', 'active', 'done')
    `);

    await queryRunner.query(`
      CREATE TYPE "difficulty_enum" AS ENUM ('easy', 'medium', 'hard')
    `);

    await queryRunner.query(`
      CREATE TYPE "interface_mode_enum" AS ENUM ('chameleon', 'board', 'theatre', 'terminal')
    `);

    await queryRunner.query(`
      CREATE TYPE "ai_visibility_enum" AS ENUM ('hidden', 'captain', 'team')
    `);

    await queryRunner.query(`
      CREATE TYPE "log_type_enum" AS ENUM ('phase', 'bot', 'player', 'system', 'emotion')
    `);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" varchar NOT NULL,
        "email" varchar NOT NULL,
        "passwordHash" varchar NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'user',
        "lastActiveAt" TIMESTAMPTZ,
        "isOnline" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Create scenarios table
    await queryRunner.query(`
      CREATE TABLE "scenarios" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "slug" varchar NOT NULL,
        "icon" varchar NOT NULL,
        "title" varchar NOT NULL,
        "subtitle" varchar NOT NULL,
        "description" text NOT NULL DEFAULT '',
        "difficulty" "difficulty_enum" NOT NULL,
        "published" boolean NOT NULL DEFAULT false,
        "requiredBots" text,
        "recommendedBots" text,
        "avgDurationMinutes" integer,
        "sessionsCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_scenarios" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_scenarios_slug" UNIQUE ("slug")
      )
    `);

    // Create bot_configs table
    await queryRunner.query(`
      CREATE TABLE "bot_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "specialistId" varchar NOT NULL,
        "name" varchar NOT NULL,
        "description" text NOT NULL,
        "personality" text NOT NULL,
        "systemPrompt" text NOT NULL,
        "model" varchar NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "stars" integer NOT NULL,
        "tag" varchar,
        "temperature" decimal(3,2) NOT NULL,
        "maxTokens" integer NOT NULL,
        "usageCount" integer NOT NULL DEFAULT 0,
        "avgRating" decimal(3,2) NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_bot_configs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_bot_configs_specialistId" UNIQUE ("specialistId")
      )
    `);

    // Create game_sessions table
    await queryRunner.query(`
      CREATE TABLE "game_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" varchar NOT NULL,
        "status" "game_status_enum" NOT NULL DEFAULT 'draft',
        "scenarioId" uuid NOT NULL,
        "hostId" uuid NOT NULL,
        "difficulty" "difficulty_enum" NOT NULL,
        "durationMinutes" integer NOT NULL,
        "interfaceMode" "interface_mode_enum" NOT NULL,
        "aiVisibility" "ai_visibility_enum" NOT NULL,
        "crewSize" integer NOT NULL,
        "progress" integer NOT NULL DEFAULT 0,
        "energy" integer NOT NULL DEFAULT 7,
        "startedAt" TIMESTAMPTZ,
        "completedAt" TIMESTAMPTZ,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_game_sessions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_game_sessions_scenario" FOREIGN KEY ("scenarioId") REFERENCES "scenarios"("id") ON DELETE NO ACTION,
        CONSTRAINT "FK_game_sessions_host" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE NO ACTION
      )
    `);

    // Create session_participants table
    await queryRunner.query(`
      CREATE TABLE "session_participants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "userId" uuid,
        "botConfigId" uuid,
        "role" varchar NOT NULL,
        "isOnline" boolean NOT NULL DEFAULT false,
        "contributionsCount" integer NOT NULL DEFAULT 0,
        "currentEmotion" varchar,
        "slotIndex" integer NOT NULL,
        "joinedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_session_participants" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_participants_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_session_participants_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_session_participants_bot" FOREIGN KEY ("botConfigId") REFERENCES "bot_configs"("id") ON DELETE SET NULL
      )
    `);

    // Create session_phases table
    await queryRunner.query(`
      CREATE TABLE "session_phases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "name" varchar NOT NULL,
        "durationMinutes" integer NOT NULL,
        "orderIndex" integer NOT NULL,
        "status" "phase_status_enum" NOT NULL DEFAULT 'pending',
        "startedAt" TIMESTAMPTZ,
        "completedAt" TIMESTAMPTZ,
        CONSTRAINT "PK_session_phases" PRIMARY KEY ("id"),
        CONSTRAINT "FK_session_phases_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Create chat_messages table
    await queryRunner.query(`
      CREATE TABLE "chat_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "participantId" uuid NOT NULL,
        "text" text NOT NULL,
        "isSystem" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_chat_messages" PRIMARY KEY ("id"),
        CONSTRAINT "FK_chat_messages_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_chat_messages_participant" FOREIGN KEY ("participantId") REFERENCES "session_participants"("id") ON DELETE CASCADE
      )
    `);

    // Create index on chat_messages.sessionId
    await queryRunner.query(`
      CREATE INDEX "IDX_chat_messages_sessionId" ON "chat_messages" ("sessionId")
    `);

    // Create board_cards table
    await queryRunner.query(`
      CREATE TABLE "board_cards" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "column" varchar NOT NULL,
        "text" text NOT NULL,
        "authorParticipantId" uuid NOT NULL,
        "votes" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_board_cards" PRIMARY KEY ("id"),
        CONSTRAINT "FK_board_cards_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_board_cards_author" FOREIGN KEY ("authorParticipantId") REFERENCES "session_participants"("id") ON DELETE CASCADE
      )
    `);

    // Create emotion_snapshots table
    await queryRunner.query(`
      CREATE TABLE "emotion_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "engagement" decimal(5,2) NOT NULL,
        "tension" decimal(5,2) NOT NULL,
        "creativity" decimal(5,2) NOT NULL,
        "fatigue" decimal(5,2) NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emotion_snapshots" PRIMARY KEY ("id"),
        CONSTRAINT "FK_emotion_snapshots_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Create activity_logs table
    await queryRunner.query(`
      CREATE TABLE "activity_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "sessionId" uuid NOT NULL,
        "type" "log_type_enum" NOT NULL,
        "text" text NOT NULL,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_activity_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_activity_logs_session" FOREIGN KEY ("sessionId") REFERENCES "game_sessions"("id") ON DELETE CASCADE
      )
    `);

    // Create system_settings table
    await queryRunner.query(`
      CREATE TABLE "system_settings" (
        "key" varchar NOT NULL,
        "value" jsonb NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "PK_system_settings" PRIMARY KEY ("key")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "system_settings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "activity_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emotion_snapshots"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "board_cards"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_chat_messages_sessionId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session_phases"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "session_participants"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "game_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bot_configs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "scenarios"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "log_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "ai_visibility_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "interface_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "difficulty_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "phase_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "game_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
