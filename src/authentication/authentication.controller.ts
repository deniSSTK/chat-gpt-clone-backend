import { Body, Controller, Get, HttpCode, HttpException, HttpStatus, Logger, Post, Req, Res } from '@nestjs/common';
import { AuthenticationService, iResult } from './authentication.service';
import { Response, Request } from 'express';

@Controller('authentication')
export class AuthenticationController {
	private logger = new Logger('AuthenticationController');

	constructor(private readonly authenticationService: AuthenticationService) {}

	@Get('check-auth')
	checkAuth(
		@Req() req: Request,
		@Res() res: Response,
	) {
		const userId = req.cookies['userId'];
		res.json({ isAuthenticated: userId !== undefined });
	}

	@Post('log-in')
	async logIn(
		@Body() body: {
			email: string;
			password: string;
		},
		@Res() res: Response,
	): Promise<void> {
		try {
			const { email, password } = body;
			const result: iResult = await this.authenticationService.logIn(email, password);
			res.cookie('userId', result.id, {
				httpOnly: true,
				secure: true,
				sameSite: 'none',
				maxAge: 24 * 60 * 60 * 7000,
			});
			res.status(HttpStatus.OK).json({
				status: HttpStatus.OK
			})
		} catch (error) {
			throw new HttpException(
				{error: error.response, status: error.status},
				error.status,
			)
		}
	}

	@Post('create-user')
	@HttpCode(201)
	async createUser(
		@Body() body: {
			email: string;
			password: string;
		},
		@Res() res: Response,
		): Promise<void> {
			try {
				const { email, password } = body;
				const result: iResult = await this.authenticationService.createUser(email, password);
				res.cookie('userId', result.id, {
					httpOnly: true,
					secure: true,
					sameSite: 'none',
					maxAge: 24 * 60 * 60 * 7000,
				});
				res.status(HttpStatus.CREATED).json({
					status: HttpStatus.CREATED,
				});
			} catch (error) {
				if (error instanceof HttpException) {
					const response = error.getResponse();
					if (typeof response === 'object') {
						const responseData = typeof response === 'object'
							? response as Record<string, any>
							: { message: response };
						const errorMessage = responseData.error
							? responseData.error
							: responseData.message;
						throw new HttpException(
							{ error: errorMessage },
							errorMessage.toLowerCase() === 'user already exists' ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR,
						);
					}
				}
				throw new HttpException(
					{error: error.message, status: HttpStatus.INTERNAL_SERVER_ERROR},
					HttpStatus.INTERNAL_SERVER_ERROR,
				)
			}
	}
}
