"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.AppModule = void 0;
var common_1 = require("@nestjs/common");
var app_controller_1 = require("./app.controller");
var typeorm_1 = require("@nestjs/typeorm");
var app_service_1 = require("./app.service");
var user_entity_1 = require("./user/entity/user.entity");
var user_module_1 = require("./user/user.module");
var events_gateway_1 = require("./room/events.gateway");
var AppModule = /** @class */ (function () {
    function AppModule() {
    }
    AppModule = __decorate([
        common_1.Module({
            imports: [
                typeorm_1.TypeOrmModule.forRoot({
                    type: 'mysql',
                    host: 'localhost',
                    port: 3306,
                    username: 'root',
                    password: 'lzx666666',
                    database: 'vinci',
                    entities: [user_entity_1.User],
                    timezone: 'UTC',
                    charset: 'utf8mb4',
                    multipleStatements: true,
                    dropSchema: false,
                    synchronize: true,
                    logging: true
                }),
                user_module_1.UsersModule,
            ],
            controllers: [app_controller_1.AppController],
            providers: [app_service_1.AppService, events_gateway_1.EventGateway]
        })
    ], AppModule);
    return AppModule;
}());
exports.AppModule = AppModule;
