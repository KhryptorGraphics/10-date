import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly userService: UserService) {}

  @Roles('admin')
  @Get('users')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }

  @Roles('admin')
  @Get('users/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUserById(id);
  }

  @Roles('admin')
  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() updateData: any) {
    return this.userService.updateUser(id, updateData);
  }

  @Roles('admin')
  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }
}
