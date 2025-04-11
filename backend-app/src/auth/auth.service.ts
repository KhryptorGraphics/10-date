import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../user/user.entity/user.entity';
import { PasswordReset } from './password-reset.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepo: Repository<PasswordReset>,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string, age: number) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, passwordHash, name, age });
    await this.userRepo.save(user);
    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return this.generateTokens(user);
  }

  async oauthLogin(provider: string, providerId: string, email: string, name: string) {
    let user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      user = this.userRepo.create({ email, name });
    }
    if (provider === 'google') user.oauthGoogleId = providerId;
    if (provider === 'facebook') user.oauthFacebookId = providerId;
    if (provider === 'apple') user.oauthAppleId = providerId;
    await this.userRepo.save(user);
    return this.generateTokens(user);
  }

  async refreshToken(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.generateTokens(user);
  }

  private generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { secret: process.env.JWT_SECRET, expiresIn: '7d' });
    return { accessToken, refreshToken, userId: user.id, email: user.email };
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new NotFoundException('User not found');

    // Generate a random token
    const token = randomBytes(32).toString('hex');
    
    // Create a password reset record
    const passwordReset = this.passwordResetRepo.create({
      email,
      token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
    });
    
    await this.passwordResetRepo.save(passwordReset);

    // In a real implementation, you would send an email with a link containing the token
    return { 
      message: 'Password reset link sent to your email',
      // For development only:
      token: token 
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordReset = await this.passwordResetRepo.findOne({
      where: { token, used: false },
    });

    if (!passwordReset) throw new UnauthorizedException('Invalid or expired token');

    if (new Date() > passwordReset.expiresAt) {
      throw new UnauthorizedException('Token expired');
    }

    const user = await this.userRepo.findOne({ where: { email: passwordReset.email } });
    if (!user) throw new NotFoundException('User not found');

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = passwordHash;
    await this.userRepo.save(user);

    // Mark token as used
    passwordReset.used = true;
    await this.passwordResetRepo.save(passwordReset);

    return { message: 'Password updated successfully' };
  }
}
