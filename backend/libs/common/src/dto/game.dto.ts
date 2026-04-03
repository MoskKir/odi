import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { GameStatus } from '../enums/game-status.enum';
import { Difficulty } from '../enums/difficulty.enum';

class PhaseDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1)
  durationMinutes: number;
}

class BoardColumnDto {
  @IsString()
  id: string;

  @IsString()
  title: string;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhaseDto)
  phases?: PhaseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BoardColumnDto)
  boardColumns?: BoardColumnDto[];
}

export class UpdateGameStatusDto {
  @IsEnum(GameStatus)
  status: GameStatus;
}
