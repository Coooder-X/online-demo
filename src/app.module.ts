import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { User } from './user/entity/user.entity';
import { UsersModule } from './user/user.module';
import { EventGateway } from './room/events.gateway';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'lzx666666',
      database: 'vinci',
      entities: [User],
      timezone: 'UTC',
      charset: 'utf8mb4',
      multipleStatements: true,
      dropSchema: false,
      synchronize: true, // 是否自动将实体类同步到数据库
      logging: true,
    }),
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventGateway],
})
export class AppModule {}
