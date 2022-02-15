import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entity/user.entity';
import { User as UserInfo } from 'src/user/dto/user.dto'
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>
    ) { }

    login(): string {
        return 'Hello World!';
    }

    async register(User): Promise<User> {
        return await this.usersRepository.save(User);
    }

    async findByUid(uid: string): Promise<User> {
        return await this.usersRepository.findOne({ uid });
    }

    async findByName(username: string): Promise<User> {
        return await this.usersRepository.findOne({ username });
    }

    async findByAccount(userInfo: UserInfo): Promise<User> {
        const { username, password } = userInfo;
        return await this.usersRepository.findOne({ username, password });
    }

    // async findByAccount(userInfo: UserInfo): Promise<User> {
    //     const { username, password } = userInfo;
    //     console.log('info', userInfo);
        
    //     return await this.usersRepository.query(`select * from user 
    //         where username='${username}' and password='${password}'`);
    // }
}
