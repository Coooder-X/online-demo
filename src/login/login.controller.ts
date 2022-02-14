import { Body, Controller, Post } from '@nestjs/common';
import { User } from 'src/user.dto';
import { LoginService } from './login.service';

@Controller('login')
export class LoginController {
    constructor(private readonly loginService: LoginService) { }

    @Post()
    login(@Body() userInfo: User): string {
        console.log(userInfo);
        return this.loginService.login();
    }
}
