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
}
