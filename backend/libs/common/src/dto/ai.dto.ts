import { IsNumber, IsString, IsUUID, Max, Min } from 'class-validator';

export class GenerateDto {
  @IsUUID()
  sessionId: string;

  @IsUUID()
  botConfigId: string;

  @IsString()
  trigger: string;
}

export class EmotionResultDto {
  @IsUUID()
  sessionId: string;

  @IsNumber()
  @Min(0)
  @Max(1)
  engagement: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  tension: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  creativity: number;

  @IsNumber()
  @Min(0)
  @Max(1)
  fatigue: number;
}
