import { Controller, Get, Put, Param, Body, Post, Delete } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMyProfile() {
    // Placeholder: get user from JWT
    const userId = 'mock-user-id';
    return this.userService.getProfile(userId);
  }

  @Put('me')
  async updateMyProfile(@Body() updateData: any) {
    const userId = 'mock-user-id';
    return this.userService.updateProfile(userId, updateData);
  }

  @Get(':id')
  async getUserProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }

  @Post('me/images')
  async uploadProfileImage(@Body() imageData: any) {
    // Placeholder for image upload
    return { message: 'Profile image uploaded (placeholder)' };
  }

  @Delete('me/images/:imageId')
  async deleteProfileImage(@Param('imageId') imageId: string) {
    // Placeholder for image deletion
    return { message: 'Profile image deleted (placeholder)' };
  }
}
