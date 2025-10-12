import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DetectionService } from './detection.service';

interface DetectRequest {
  image: string; // Base64 encoded image
  ringCameraId?: string; // Optional Ring camera ID for future integration
}

@Controller('detect')
export class DetectionController {
  constructor(private readonly detectionService: DetectionService) {}

  @Post()
  async detectObjects(@Body() body: DetectRequest) {
    try {
      const { image, ringCameraId } = body;

      if (!image) {
        throw new HttpException('Image data is required', HttpStatus.BAD_REQUEST);
      }

      // Process image with YOLOv8
      const detections = await this.detectionService.detectWithYOLO(image);

      return {
        success: true,
        detections,
        timestamp: new Date().toISOString(),
        ringCameraId: ringCameraId || null,
      };
    } catch (error) {
      console.error('Detection error:', error);
      throw new HttpException(
        error.message || 'Failed to process image',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('ring-snapshot')
  async detectFromRingSnapshot(@Body() body: { imageUrl: string; cameraId: string }) {
    try {
      const { imageUrl, cameraId } = body;

      if (!imageUrl || !cameraId) {
        throw new HttpException('Image URL and camera ID are required', HttpStatus.BAD_REQUEST);
      }

      // Fetch image from Ring (placeholder for future Ring API integration)
      // const imageData = await this.detectionService.fetchRingImage(imageUrl);
      
      // For now, accept the image URL directly
      const detections = await this.detectionService.detectWithYOLO(imageUrl);

      return {
        success: true,
        detections,
        cameraId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Ring detection error:', error);
      throw new HttpException(
        error.message || 'Failed to process Ring snapshot',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

