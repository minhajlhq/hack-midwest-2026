import { IsNumber, Min, IsIn, IsOptional } from 'class-validator';

export class UpdateBalanceDto {
  @IsNumber({}, { message: 'Balance adjustment must be a number' })
  @Min(0, { message: 'Balance adjustment cannot be negative' })
  balanceAdjustment: number;

  @IsOptional()
  @IsIn(['+', '-'], { message: 'Operation must be either "+" or "-"' })
  operation?: '+' | '-' = '+';
}
