import { IsString, IsNumber, IsOptional, IsIn, Min, IsObject } from 'class-validator';

export class CreateRecycleTransactionDto {
  @IsString({ message: 'Recycled item classification must be a string' })
  recycledItemClassification: string;

  @IsString({ message: 'Item description must be a string' })
  itemDescription: string;

  @IsNumber({}, { message: 'Reward amount must be a number' })
  @Min(0, { message: 'Reward amount cannot be negative' })
  rewardAmount: number;

  @IsOptional()
  @IsString({ message: 'Location must be a string' })
  location?: string;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;

  @IsOptional()
  @IsString({ message: 'Image URL must be a string' })
  imageUrl?: string;

  @IsOptional()
  @IsObject({ message: 'Metadata must be an object' })
  metadata?: {
    weight?: number;
    volume?: number;
    condition?: string;
    aiConfidence?: number;
    [key: string]: any;
  };
}
