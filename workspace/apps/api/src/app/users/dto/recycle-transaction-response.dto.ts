export class RecycleTransactionResponseDto {
  id: string;
  userId: string;
  recycledItemClassification: string;
  itemDescription: string;
  rewardAmount: number;
  location?: string;
  notes?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  processedAt?: Date;
  imageUrl?: string;
  metadata?: {
    weight?: number;
    volume?: number;
    condition?: string;
    aiConfidence?: number;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<RecycleTransactionResponseDto>) {
    Object.assign(this, partial);
  }
}
