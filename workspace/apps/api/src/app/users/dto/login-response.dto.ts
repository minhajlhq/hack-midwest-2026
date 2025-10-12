export class LoginResponseDto {
  success: boolean;
  message: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    walletAddress: string;
    currentBalance?: number;
    isActive: boolean;
    lastLogin?: Date;
  };
  token?: string; // For future JWT implementation

  constructor(partial: Partial<LoginResponseDto>) {
    Object.assign(this, partial);
  }
}
