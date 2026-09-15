// src/users/users.controller.ts

import {
  Controller,
  Get,
  Param,
} from '@nestjs/common';

import { UsersService } from './users.service';

import { validateUuid } from '../common/validation';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) {}

  @Get(':id')
  async getUser(
    @Param('id') id: string,
  ) {
    validateUuid(id, 'id');

    return this.usersService.getUser(id);
  }
}