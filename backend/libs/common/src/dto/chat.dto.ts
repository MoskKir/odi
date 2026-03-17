import { IsBoolean, IsDateString, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  text: string;
}

export class MessageResponseDto {
  @IsUUID()
  id: string;

  @IsUUID()
  sessionId: string;

  @IsUUID()
  participantId: string;

  @IsString()
  author: string;

  @IsString()
  role: string;

  @IsString()
  text: string;

  @IsBoolean()
  isSystem: boolean;

  @IsDateString()
  createdAt: string;
}
