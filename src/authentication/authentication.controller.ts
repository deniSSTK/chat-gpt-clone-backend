import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpException,
	HttpStatus,
	Logger, Param,
	Post,
	Req,
	Res,
} from '@nestjs/common';
import { AuthenticationService, iProfileInfo, iResult } from './authentication.service';
import { Response, Request } from 'express';
import * as process from 'node:process';

@Controller('authentication')
export class AuthenticationController {
	private logger = new Logger('AuthenticationController');

	constructor(private readonly authenticationService: AuthenticationService) {}

	private setCookies = (res: Response, param: string) => {
		res.cookie('userId', param, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? "none" : 'lax',
			maxAge: 24 * 60 * 60 * 7000,
		});
	}

	private deleteCookies = (res: Response) => {
		res.clearCookie('userId', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: process.env.NODE_ENV === 'production' ? "none" : 'lax',
		});
	}

	@Get('check-auth')
	checkAuth(
		@Req() req: Request,
		@Res() res: Response,
	) {
		try {
			const userId = req.cookies['userId'];
			res.json({ isAuthenticated: userId !== undefined });
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	// @Get('check-maintenance')
	// async checkMaintenance(
	// ): Promise<
	// 	{maintenance: boolean}
	// > {
	// 	try {
	// 		const data = await this.authenticationService.checkMaintenance();
	// 		return { maintenance: data };
	// 	} catch (error) {
	// 		throw new HttpException(
	// 			error.message,
	// 			error.status,
	// 		)
	// 	}
	// }

	@Delete('log-out')
	async logOut(
		@Res() res: Response
	): Promise<void> {
		try {
			this.deleteCookies(res);
			res.status(200).json({ success: true });
		} catch (error: any) {
			res.status(error.status || 500).json({ message: error.message || 'Internal server error' });
		}
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
			this.setCookies(res, result.id);
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
				this.setCookies(res, result.id);
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

	@Get('get-user-id')
	async getUserId(
		@Req() req: Request,
	): Promise<string> {
		try {
			return req.cookies['userId'];
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	@Post("get-user-profile-info/:id")
	async getUserProfileInfo(
		@Param('id') id: string,
		@Body() body: {
			canEditPage: boolean
		}
	): Promise<iProfileInfo> {
		return await this.authenticationService.getUserProfileInfo(id, body.canEditPage)
	}
}
