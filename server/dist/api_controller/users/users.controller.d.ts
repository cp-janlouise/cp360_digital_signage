import { UsersService } from '../../api_service/users/users.service.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(body: {
        email: string;
        name?: string;
    }): any;
    findAll(): any;
    findOne(id: string): any;
    remove(id: string): any;
}
