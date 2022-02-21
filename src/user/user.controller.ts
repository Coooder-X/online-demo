import { Body, Controller, Post } from '@nestjs/common';
import { User as UserInfo } from 'src/user/dto/user.dto';
import { User } from 'src/user/entity/user.entity';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly UserService: UserService) {}

  @Post('login')
  async login(@Body() userInfo: UserInfo): Promise<User> {
    console.log(userInfo);
    console.log('resUser', await this.UserService.findByAccount(userInfo));

    return await this.UserService.findByAccount(userInfo);
    // return this.UserService.login();
  }

  @Post('register')
  async register(@Body() userInfo: UserInfo): Promise<boolean> {
    let user: User = await this.UserService.findByName(userInfo.username);
    if (user) return false;
    const newUser: User = { ...userInfo };
    user = await this.UserService.register(newUser);
    return user !== undefined;
  }
}
