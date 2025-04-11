import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity/user.entity';
import { Interest } from './user.entity/interest.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, Interest]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService, TypeOrmModule]
})
export class UserModule {}
