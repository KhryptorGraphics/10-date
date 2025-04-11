import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { PasswordRecoveryDto } from './dto/password-recovery.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.email, dto.password, dto.name, dto.age);
  }

  @Post('login')
  async login(
    @Body('email') email: string,
    @Body('password') password: string,
  ) {
    return this.authService.login(email, password);
  }

  @Post('oauth')
  async oauthLogin(
    @Body('provider') provider: string,
    @Body('providerId') providerId: string,
    @Body('email') email: string,
    @Body('name') name: string,
  ) {
    return this.authService.oauthLogin(provider, providerId, email, name);
  }

  @Post('refresh')
  async refresh(@Body('userId') userId: string) {
    return this.authService.refreshToken(userId);
  }

  @Post('password-recovery')
  async passwordRecovery(@Body() dto: PasswordRecoveryDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
