import { Controller, Post, Get, Put, Body, Param, HttpCode, HttpStatus, ValidationPipe, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';
import { CreateRecycleTransactionDto } from './dto/create-recycle-transaction.dto';
import { RecycleTransactionResponseDto } from './dto/recycle-transaction-response.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createUser(@Body(ValidationPipe) createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.usersService.createUser(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(ValidationPipe) loginDto: LoginDto): Promise<LoginResponseDto> {
    return this.usersService.login(loginDto);
  }

  @Get()
  async getAllUsers(): Promise<UserResponseDto[]> {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  async getUserById(@Param('id') id: string): Promise<UserResponseDto> {
    const user = await this.usersService.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @Put(':id/balance')
  @HttpCode(HttpStatus.OK)
  async updateUserBalance(
    @Param('id') id: string,
    @Body(ValidationPipe) updateBalanceDto: UpdateBalanceDto
  ): Promise<UserResponseDto> {
    return this.usersService.updateBalance(id, updateBalanceDto);
  }

  @Post(':id/recycle-transactions')
  @HttpCode(HttpStatus.CREATED)
  async createRecycleTransaction(
    @Param('id') userId: string,
    @Body(ValidationPipe) createRecycleTransactionDto: CreateRecycleTransactionDto
  ): Promise<RecycleTransactionResponseDto> {
    return this.usersService.createRecycleTransaction(userId, createRecycleTransactionDto);
  }

  @Get(':id/recycle-transactions')
  async getUserRecycleTransactions(
    @Param('id') userId: string
  ): Promise<RecycleTransactionResponseDto[]> {
    return this.usersService.getUserRecycleTransactions(userId);
  }
}
