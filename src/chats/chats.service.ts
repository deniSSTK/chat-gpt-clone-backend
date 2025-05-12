import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;
import { generateConversationNameConfig } from '../config/aiGenerateSettings';

export interface iMessage {
	content: string;
	role: "system" | "user" | "assistant";
	imageUrl?: string;
}

export interface iChatList {
	chatName: string;
	chatId: string;
	lastMessageTime: number;
}

@Injectable()
export class ChatsService {
	private logger = new Logger('AuthenticationService');

	private db: Firestore;

	constructor(private readonly firebaseService: FirebaseService) {
		this.db = this.firebaseService.getFirestore();
	}

	async saveMessage(
		messages: iMessage[],
		chatId: string,
		userId: string,
	): Promise<boolean> {
		try {
			const chatRef = this.db.collection('chats').doc(chatId);
			const chatDoc = await chatRef.get();
			if (!chatDoc.exists) {
				const messagesForGenerate = generateConversationNameConfig(messages[0].content);

				const response = await fetch('https://model-fast-api-w4du.onrender.com/chat', {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						'accept': 'application/json',
					},
					body: JSON.stringify({
						messages: messagesForGenerate
					})
				})

				const data = await response.json();
				const chatName = data.split('</think>\n\n')[1].trim();

				await chatRef.set({
					messages: messages,
					timeCreated: Date.now(),
					creatorId: userId,
					lastMessageTime: Date.now(),
					isActive: true,
					chatName,
				})

				const userRef = this.db.collection('users').doc(userId);
				await userRef.update({
					chatList: firestore.FieldValue.arrayUnion(chatId),
				})
			}
			await chatRef.update({
				messages: firestore.FieldValue.arrayUnion(...messages),
				lastMessageTime: Date.now(),
			})
			return true;
		} catch (error) {
			throw new HttpException (
				{ error: error.message || 'Internal Server Error' },
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async getAllUserChats(
		userId: string,
	): Promise<iChatList[]> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userDoc = await userRef.get();
			if (userDoc.exists) {
				const userChatListIds = userDoc.data()?.chatList;

				// const chatList: iChatList[] = await Promise.all(userChatListIds.map(async (id) => {
				// 	const chatDoc = await this.db.collection('chats').doc(id).get();
				// 	if (chatDoc.exists) {
				// 		const data = chatDoc.data();
				//
				// 		return {
				// 			chatName: data?.chatName || 'Unknown',
				// 			chatId: id,
				// 			lastMessageTime: data?.timeCreated || 0,
				// 		};
				// 	}
				// }));

				return  await Promise.all(userChatListIds.map(async (id) => {
					const chatDoc = await this.db.collection('chats').doc(id).get();
					if (chatDoc.exists) {
						const data = chatDoc.data();

						return {
							chatName: data?.chatName || 'Unknown',
							chatId: id,
							lastMessageTime: data?.timeCreated || 0,
						};
					}
				}));
			}
			throw new HttpException(
				'User does not exist',
				HttpStatus.NOT_FOUND
			)
		} catch (error) {
			throw new HttpException(
				{ error: error.message},
				error.status
			)
		}
	}

	async getAllMessages(
		chatId: string,
	): Promise<iMessage[]> {
		try {
			const chatRef = this.db.collection('chats').doc(chatId);
			const chatData = await chatRef.get();
			if (chatData.exists) {
				const data = chatData.data();
				if (data) return data.messages;
			}
			else {
				throw new HttpException(
					'Chat does not exist',
					HttpStatus.NOT_FOUND
				)
			}
			return [];
		} catch (error) {
			throw new HttpException(
				{ error: error.message },
				error.status
			)
		}
	}

	async ifUserHasChat(
		chatId: string,
		userId: string,
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userDoc = await userRef.get();
			if (userDoc.exists) {
				const userData = userDoc.data();
				return userData && userData.chatList.includes(chatId);
			}
			else {
				throw new HttpException(
					{error: "User does not have this chat", status: HttpStatus.CONFLICT},
					HttpStatus.CONFLICT,
				)
			}
		} catch (error) {
			throw new HttpException(
				{error: error.message, status: HttpStatus.INTERNAL_SERVER_ERROR},
				HttpStatus.INTERNAL_SERVER_ERROR,
			)
		}
	}
}
