import { IsEmail, IsString, MinLength, MaxLength, IsInt, Min, Max } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name: string;

  @IsInt()
  @Min(18)
  @Max(100)
  age: number;
}
