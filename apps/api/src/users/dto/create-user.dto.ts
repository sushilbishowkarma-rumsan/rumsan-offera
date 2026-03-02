import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';

// Ensure the "export" keyword is here!
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  googleId: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  avatar?: string;
}
