import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as bcrypt from 'bcrypt';
import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;

export interface iResult {
	id: string;
}

export interface iPublicImage {
	imageUrl: string;
}

export interface iProfileInfo {
	chatsCount: number;
	imagesCount: number;
	publicGallery: {
		imageUrl: string;
	};
	userIconUrl: string;
	userName: string;
	galleryList?: string[];
}

export interface iUser {
	email: string;
	userName: string;
	chatList: string[],
	createdAt: number,
	banned: boolean,
	password: string,
	galleryList: string[],
	personalityStyles: string,
	publicGallery: iPublicImage[],
	chatsCount: number,
	imagesCount: number,
	userIconUrl: string,

	//implement in future
	following: string[]
	followers: string[],

	// codeTheme: string;

	// settings: {
	// 	language: string;
	// }
	// нужно реализовывать анализ какой язык предпочитает юзер
}

@Injectable()
export class AuthenticationService {
	private logger = new Logger('AuthenticationService');

	private db: Firestore;

	constructor(private readonly firebaseService: FirebaseService) {
		this.db = this.firebaseService.getFirestore();
	}

	async createUser(
		email: string,
		password: string
	): Promise<iResult> {
		try {
			const usersRef = this.db.collection('users');

			const querySnapshot = await usersRef.where('email', '==', email).get();

			if (!querySnapshot.empty) {
				throw new HttpException(
					{ message: 'user already exists' },
					HttpStatus.CONFLICT
				);
			}

			const hashedPassword = await bcrypt.hash(password, 12);

			const newUser: iUser = {
				email,
				chatList: [],
				createdAt: Date.now(),
				banned: false,
				password: hashedPassword,
				galleryList: [],
				personalityStyles: "default",
				publicGallery: [],
				chatsCount: 0,
				imagesCount: 0,
				userName: email.split('@')[0],
				userIconUrl: "",

				//implement in future
				following: [],
				followers: [],
			};

			const addNewUser = await usersRef.add(newUser);

			return {id: addNewUser.id};
		} catch (error) {
			throw new HttpException (
				{ error: error.message || 'Internal Server Error' },
				HttpStatus.INTERNAL_SERVER_ERROR
			);
		}
	}

	async logIn(
		email: string,
		password: string
	): Promise<iResult> {
		const usersRef = this.db.collection('users');
		const querySnapshot = await usersRef.where('email', '==', email).get();

		if (querySnapshot.empty) {
			throw new HttpException(
				'User not found',
				HttpStatus.NOT_FOUND
			);
		}

		const userDoc = querySnapshot.docs[0];
		const userData = userDoc.data();

		const isPasswordValid = await bcrypt.compare(password, userData.password);

		if (!isPasswordValid) {
			throw new HttpException(
				'Invalid credentials',
				HttpStatus.UNAUTHORIZED
			);
		}

		return { id: userDoc.id};
	}

	async getUserProfileInfo(
		userId: string,
		canEditPage: boolean
	): Promise<iProfileInfo> {
		try {
			const userDoc = await this.db.collection('users').doc(userId).get();
			if (!userDoc.exists) {
				throw new HttpException(
					'User not found',
					HttpStatus.NOT_FOUND
				)
			}

			const data = userDoc.data() as iProfileInfo;

			if (!data) {
				throw new HttpException(
					'User not found',
					HttpStatus.NOT_FOUND
				)
			}

			return {
				chatsCount: data.chatsCount,
				imagesCount: data.imagesCount,
				publicGallery: data.publicGallery,
				userIconUrl: data.userIconUrl,
				userName: data.userName,
				...(canEditPage && { galleryList: data.galleryList })
			};
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}
}
