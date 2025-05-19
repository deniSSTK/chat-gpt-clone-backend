import { Body, Controller, Get, HttpException, Logger, Post, Req } from '@nestjs/common';
import { PersonalizationService } from './personalization.service';
import { Request } from 'express';

@Controller('personalization')
export class PersonalizationController {
	private logger = new Logger('PersonalizationController');

	constructor(private readonly personalizationService: PersonalizationService) {}

	@Get('get-personalization-style')
	async getPersonalizationStyle(
		@Req() req: Request,
	): Promise<string> {
		try {
			return await this.personalizationService.getPersonalizationStyle(req.cookies['userId']);
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	@Post('update-personalization-style')
	async updatePersonalizationStyle(
		@Req() req: Request,
		@Body() body: {
			style: string
		}
	): Promise<boolean> {
		try {
			return this.personalizationService.updatePersonalizationStyle(req.cookies['userId'], body.style);
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	@Post('update-user-icon')
	async setUserIcon(
		@Req() req: Request,
		@Body() body: {
			imageUrl: string
		}
	): Promise<boolean> {
		try {
			return this.personalizationService.setUserIcon(body.imageUrl, req.cookies["userId"])
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	@Post('add-image-to-public-gallery')
	async addImageToPublicGallery(
		@Body() body: {
			imageUrl: string
		},
		@Req() req: Request,
	): Promise<boolean> {
		try {
			return await this.personalizationService.addImageToPublicGallery(req.cookies['userId'], body.imageUrl);
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	@Post('remove-image-from-public-gallery')
	async removeImageFromPublicGallery(
		@Body() body: {
			imageUrl: string
		},
		@Req() req: Request,
	): Promise<boolean> {
		try {
			return await this.personalizationService.removeImageFromPublicGallery(req.cookies['userId'], body.imageUrl);
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}
}
