import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as bcrypt from 'bcrypt';
import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;

export interface iResult {
	id: string;
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
	): Promise<iResult | never> {
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

			const newUser = await usersRef.add({
				email,
				chatList: [],
				createdAt: Date.now(),
				banned: false,
				password: hashedPassword,
			});

			return {id: newUser.id};
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
}
