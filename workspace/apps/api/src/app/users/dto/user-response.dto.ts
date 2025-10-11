export class UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  walletAddress?: string;
  currentBalance?: number;
  isActive: boolean;
  profilePicture?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
