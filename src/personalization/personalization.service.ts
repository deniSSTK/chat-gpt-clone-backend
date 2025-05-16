import { HttpException, Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { firestore } from 'firebase-admin';
import Firestore = firestore.Firestore;

@Injectable()
export class PersonalizationService {
	private logger = new Logger('PersonalizationService');
	private db: Firestore;

	constructor(private readonly firebaseService: FirebaseService) {
		this.db = this.firebaseService.getFirestore();
	}

	async getPersonalizationStyle(
		userId: string,
	): Promise<string> {
		try {
			const userDoc = await this.db.collection('users').doc(userId).get();
			if (userDoc.exists) {
				const data = userDoc.data()?.personalityStyles;
				if (data) {
					return data;
				}
			}

			return "";
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	async updatePersonalizationStyle(
		userId: string,
		style: string
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			userRef.update({
				personalityStyles: style,
			})
			return true;
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}
}
