import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserEntity } from '../user/user.entity/user.entity';
import { PasswordReset } from './password-reset.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PasswordReset]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService, JwtModule]
})
export class AuthModule {}
