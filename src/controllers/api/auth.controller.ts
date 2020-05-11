import { Controller, Post, Body, Req, Put } from "@nestjs/common";
import { AdministratorService } from "src/services/administrator/administrator.service";
import { LoginAdministratorDto } from "src/dtos/administrator/login.administrator.dto";
import { ApiResponse } from "src/misc/api.response.class";
import * as crypto from 'crypto';
import { LoginInfoAdministratorDto } from "src/dtos/administrator/login.info.administator.dto";
import * as jwt from 'jsonwebtoken';//ovo dodajemo posle instalacije njegove
import { JwtDataAdministratorDto } from "src/dtos/administrator/jwt.data.administator.dto";
import { DatabaseConfiguration } from "config/database.configuration";
import { Request } from "express";
import { jwtSecret } from "config/jwt.secret";
import { UserRegistrationDto } from "src/dtos/user/user.registration.dto";
import { UserService } from "src/services/user/user.service";

@Controller('auth')
export class AuthController {
    constructor(
        public administratorService: AdministratorService,
        public userService: UserService
        ) {    }

    @Post('login')
    //2. ovde posle data: LoginAdministratorDto dodajemo @Req i Request iz expressa
   async doLogin(@Body() data: LoginAdministratorDto, @Req() req: Request): Promise<LoginInfoAdministratorDto | ApiResponse> {
        const administrator = await this.administratorService.getByUsername(data.username);
        
        if(!administrator){
            return new Promise(resolve => resolve(new ApiResponse('error', -3001)));
        }
        const passwordHash = crypto.createHash('sha512');
        passwordHash.update(data.password);
        const passwordHashString = passwordHash.digest('hex').toUpperCase();

        if(administrator.passwordHash !== passwordHashString){
            return new Promise(resolve => resolve(new ApiResponse('error', -3002)));
        }
        //1.ovo sada dodajemo
       const jwtData = new JwtDataAdministratorDto();
       jwtData.administratorId = administrator.administratorId;
       jwtData.username = administrator.username;

       let sada = new Date();
       sada.setDate(sada.getDate() + 14);
       const istekTimestamp = sada.getTime() / 1000;
       jwtData.exp = istekTimestamp;

       //3. dodajemo ip adresu
        jwtData.ip = req.ip.toString();
        jwtData.ua = req.headers["user-agent"];

        //4. pravimo token nas
        let token: string = jwt.sign(jwtData.toPlainObject(), jwtSecret);

        const responseObject = new LoginInfoAdministratorDto(
            administrator.administratorId,
            administrator.username,
            token
        );
        return new Promise(resolve => resolve(responseObject));
        
    }

    @Put('user/register') //PUT http://localhost:3000/auth/user/register
    async userRegister(@Body() data: UserRegistrationDto){
        return await this.userService.register(data);
    }
}