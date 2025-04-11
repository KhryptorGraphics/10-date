import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { UserEntity } from './user.entity/user.entity';
import { Interest } from './user.entity/interest.entity';
import { DataManagementService } from './services/data-management.service';
import { ConsentService } from './services/consent.service';
import { DataManagementController } from './controllers/data-management.controller';
import { ConsentController } from './controllers/consent.controller';
import { ConsentPreferenceEntity } from './entities/consent-preference.entity';
import { ConsentHistoryEntity } from './entities/consent-history.entity';
import { DataExportEntity } from './entities/data-export.entity';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity, 
      Interest, 
      ConsentPreferenceEntity, 
      ConsentHistoryEntity,
      DataExportEntity
    ]),
    CommonModule,
  ],
  providers: [
    UserService, 
    DataManagementService, 
    ConsentService
  ],
  controllers: [
    UserController, 
    DataManagementController, 
    ConsentController
  ],
  exports: [
    UserService, 
    DataManagementService, 
    ConsentService, 
    TypeOrmModule
  ]
})
export class UserModule {}
