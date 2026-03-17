import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { GameStatus } from '../enums/game-status.enum';
import { Difficulty } from '../enums/difficulty.enum';

export class CreateGameDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsUUID()
  scenarioId?: string;

  @IsOptional()
  @IsString()
  scenarioSlug?: string;

  @IsEnum(Difficulty)
  difficulty: Difficulty;

  @IsNumber()
  @Min(0)
  durationMinutes: number;

  @IsString()
  interfaceMode: string;

  @IsString()
  aiVisibility: string;

  @IsNumber()
  @Min(1)
  crewSize: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  botSlots?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialistIds?: string[];
}

export class UpdateGameStatusDto {
  @IsEnum(GameStatus)
  status: GameStatus;
}
