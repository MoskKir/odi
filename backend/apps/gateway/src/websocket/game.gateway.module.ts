import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { GameGateway } from './game.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'odi-secret',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '24h' },
      }),
    }),
  ],
  providers: [GameGateway],
  exports: [GameGateway],
})
export class GameGatewayModule {}
