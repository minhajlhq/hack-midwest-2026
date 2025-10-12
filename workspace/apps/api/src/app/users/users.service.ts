import { Injectable, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UpdateBalanceDto } from './dto/update-balance.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    try {
      // Check if user already exists
      const existingUser = await this.userModel.findOne({ email: createUserDto.email });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

      // Create new user
      const newUser = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
        isActive: true,
        currentBalance: createUserDto.currentBalance || 0,
      });

      const savedUser = await newUser.save();

      // Return user without password
      return this.mapToUserResponseDto(savedUser);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findUserByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findUserByEmailResponse(email: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      return null;
    }
    return this.mapToUserResponseDto(user);
  }

  async findUserById(id: string): Promise<UserResponseDto | null> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      return null;
    }
    return this.mapToUserResponseDto(user);
  }

  async getAllUsers(): Promise<UserResponseDto[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.mapToUserResponseDto(user));
  }

  async login(loginDto: LoginDto): Promise<LoginResponseDto> {
    try {
      // Find user by email
      const user = await this.userModel.findOne({ email: loginDto.email }).exec();
      if (!user) {
        return new LoginResponseDto({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check if user is active
      if (!user.isActive) {
        return new LoginResponseDto({
          success: false,
          message: 'Account is deactivated. Please contact support.',
        });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        return new LoginResponseDto({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Update last login
      await this.updateLastLogin((user._id as any).toString());

      // Return success response with user data
      return new LoginResponseDto({
        success: true,
        message: 'Login successful',
        user: {
          id: (user._id as any).toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          walletAddress: user.walletAddress,
          currentBalance: user.currentBalance ? parseFloat(user.currentBalance.toString()) : 0,
          isActive: user.isActive,
          lastLogin: new Date(),
        },
      });
    } catch (error) {
      throw new InternalServerErrorException('Login failed');
    }
  }

  async updateBalance(userId: string, updateBalanceDto: UpdateBalanceDto): Promise<UserResponseDto> {
    try {
      // First, get the current user to check their current balance
      const currentUser = await this.userModel.findById(userId).exec();
      if (!currentUser) {
        throw new NotFoundException('User not found');
      }

      // Calculate the new balance based on the operation
      const currentBalance = currentUser.currentBalance ? parseFloat(currentUser.currentBalance.toString()) : 0;
      let newBalance: number;

      if (updateBalanceDto.operation === '-') {
        newBalance = currentBalance - updateBalanceDto.balanceAdjustment;
        // If subtraction would result in negative balance, set to 0
        if (newBalance < 0) {
          newBalance = 0;
        }
      } else {
        newBalance = currentBalance + updateBalanceDto.balanceAdjustment;
      }

      // Update the user's balance
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { 
          currentBalance: newBalance,
          updatedAt: new Date()
        },
        { new: true }
      ).exec();

      if (!updatedUser) {
        throw new NotFoundException('User not found after update');
      }

      return this.mapToUserResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to update user balance');
    }
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, { lastLogin: new Date() }).exec();
  }

  private mapToUserResponseDto(user: UserDocument): UserResponseDto {
    const userDoc = user as any;
    return new UserResponseDto({
      id: userDoc._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      walletAddress: user.walletAddress,
      currentBalance: user.currentBalance ? parseFloat(user.currentBalance.toString()) : 0,
      isActive: user.isActive,
      profilePicture: user.profilePicture,
      lastLogin: user.lastLogin,
      createdAt: userDoc.createdAt,
      updatedAt: userDoc.updatedAt,
    });
  }
}
