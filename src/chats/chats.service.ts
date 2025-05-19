import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;
import { trimText } from '../services/stringManipulation';
import { iUser } from '../authentication/authentication.service';

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

export interface iImage {
	imageUrl: string;
	prompt: string;
}

@Injectable()
export class ChatsService {
	private logger = new Logger('ChatsService');
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
				await chatRef.set({
					messages: messages,
					timeCreated: Date.now(),
					creatorId: userId,
					lastMessageTime: Date.now(),
					isActive: true,
					chatName: trimText(messages[0].content),
				})

				const userRef = this.db.collection('users').doc(userId);
				const userDoc = await userRef.get();
				const userData = userDoc.data() as iUser;
				if (userDoc) {
					await userRef.update({
						chatList: firestore.FieldValue.arrayUnion(chatId),
						chatsCount: userData.chatsCount + 1,
					})
				}

				return true;
			}

			else {
				const chatData = chatDoc.data();

				if (chatData) {
					await chatRef.update({
						messages: [...chatData.messages, ...messages],
						lastMessageTime: Date.now(),
					});
					return true;
				}
			}

			throw new HttpException(
				'Conflict',
				HttpStatus.CONFLICT
			)
		} catch (error) {
			throw new HttpException (
				error.message,
				error.status
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
				error.message,
				error.status
			)
		}
	}

	async getAllMessages(
		//TODO сделать проверку ваще что у юзера есть такой чат
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

	async deleteChats(
		userId: string,
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userDoc = await userRef.get();
			const userData = userDoc.data();

			if (!userData || !userData.chatList) {
				throw new HttpException(
					'User does not exist',
					HttpStatus.NOT_FOUND
				);
			}

			await userRef.update({
				chatList: [],
				logChatList: userData.logChatList
					? [...userData.logChatList, ...userData.chatList]
					: userData.chatList,
			})

			return true;
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	async saveImageToGallery(
		userId: string,
		imageUrl: string,
		prompt: string,
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userSnap = await userRef.get();

			if (!userSnap.exists) throw new HttpException(
				'User not found',
				HttpStatus.UNAUTHORIZED
			);

			const userDoc = userSnap.data() as {
				galleryList: {
					imageUrl: string;
					prompt: string;
				}[],
				imagesCount: number;
			};

			await userRef.update({
				galleryList: [{ imageUrl, prompt }, ...userDoc.galleryList],
				imagesCount: userDoc.imagesCount + 1,
			});
			return true;
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	async getAllImages(
		userId: string,
	): Promise<iImage[]> {
		try {
			const userDoc = await this.db.collection('users').doc(userId).get();
			const userData = userDoc.data() as { galleryList: iImage[] };

			return userData.galleryList;
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}
}
