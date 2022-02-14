import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { RegisterController } from './register/register.controller';
import { LoginController } from './login/login.controller';
import { LoginService } from './login/login.service';

@Module({
  imports: [TypeOrmModule.forRoot({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'lzx666666',
    database: 'vinci',
    entities: [],
    timezone: 'UTC',
    charset: 'utf8mb4',
    multipleStatements: true,
    dropSchema: false,
    synchronize: true, // 是否自动将实体类同步到数据库
    logging: true,
  })],
  controllers: [AppController, LoginController, RegisterController],
  providers: [AppService, LoginService],
})
export class AppModule { }
