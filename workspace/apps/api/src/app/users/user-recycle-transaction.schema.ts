import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserRecycleTransactionDocument = UserRecycleTransaction & Document;

@Schema({
  timestamps: true,
})
export class UserRecycleTransaction {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  recycledItemClassification: string; // e.g., 'plastic_bottle', 'aluminum_can', 'cardboard', etc.

  @Prop({ required: true })
  itemDescription: string; // Human-readable description of the item

  @Prop({ required: true, type: Types.Decimal128 })
  rewardAmount: Types.Decimal128; // SBC tokens earned for this transaction

  @Prop()
  location?: string; // Where the recycling took place (e.g., 'recycling_center_1', 'mobile_unit_5')

  @Prop()
  notes?: string; // Optional notes about the transaction

  @Prop({ default: 'completed' })
  status: 'pending' | 'completed' | 'failed' | 'cancelled';

  @Prop()
  processedAt?: Date; // When the transaction was processed

  @Prop()
  imageUrl?: string; // Optional image of the recycled item

  @Prop({ type: Object })
  metadata?: {
    weight?: number; // Weight of the item in kg
    volume?: number; // Volume of the item in liters
    condition?: string; // Condition of the item (e.g., 'good', 'damaged', 'dirty')
    aiConfidence?: number; // AI classification confidence score (0-1)
    [key: string]: any; // Allow for additional metadata fields
  };
}

export const UserRecycleTransactionSchema = SchemaFactory.createForClass(UserRecycleTransaction);
