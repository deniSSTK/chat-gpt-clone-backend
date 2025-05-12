import { Body, Controller, Get, HttpException, HttpStatus, Logger, Post, Req } from '@nestjs/common';
import { ChatsService, iChatList, iMessage } from './chats.service';
import { Request } from 'express';

@Controller('chats')
export class ChatsController {
	private logger = new Logger('ChatsController');

	constructor(private readonly chatsService: ChatsService) {}

	@Post('save-message')
	saveMessage(
		@Body() body: {
			messages: iMessage[],
			chatId: string,
		},
		@Req() req: Request,
	): Promise<boolean> {
		try {
			const { messages, chatId } = body;
			return this.chatsService.saveMessage(
				messages,
				chatId,
				req.cookies['userId'],
			);
		} catch (error) {
			throw new HttpException(
				{error: error.response, status: error.status},
				error.status,
			)
		}
	}

	@Get('get-chats')
	async getAllChats(
		@Req() req: Request
	): Promise<iChatList[]> {
		try {
			return await this.chatsService.getAllUserChats(req.cookies['userId']);
		} catch (error) {
			throw new HttpException(
				{error: error.message},
				error.status,
			)
		}
	}

	@Post('chat-check')
	chatCheck(
		@Body() body: {
			chatId: string;
		},
		@Req() req: Request,
	): Promise<boolean> {
		try {
			const { chatId } = body;
			return this.chatsService.ifUserHasChat(chatId, req.cookies['userId']);
		} catch (error) {
			throw new HttpException(
				{error: error.message, status: HttpStatus.INTERNAL_SERVER_ERROR},
				HttpStatus.INTERNAL_SERVER_ERROR,
			)
		}
	}

	@Post('get-messages')
	async getMessages(
		@Body() body: {
			chatId: string;
		}
	): Promise<iMessage[]> {
		try {
			return this.chatsService.getAllMessages(body.chatId)
		} catch (error) {
			throw new HttpException(
				{ error: error.message },
				error.status,
			)
		}
	}
}
