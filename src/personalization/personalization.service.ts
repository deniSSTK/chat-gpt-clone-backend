import { Body, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
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

	async setUserIcon(
		imageUrl: string,
		userId: string,
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userDoc = await userRef.get();

			if (!userDoc.exists) {
				throw new HttpException(
					'User not found',
					HttpStatus.NOT_FOUND
				)
			}

			userRef.update({
				userIconUrl: imageUrl,
			})

			return true;
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	async addImageToPublicGallery(
		userId: string,
		imageUrl: string,
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userDoc = await userRef.get();

			if (!userDoc.exists) {
				throw new HttpException(
					'User not found',
					HttpStatus.NOT_FOUND
				)
			}

			const userData = userDoc.data();
			if (userData) {
				if (
					userData.galleryList.findIndex(item => item.imageUrl === imageUrl) !== -1
					&& userData.publicGallery.findIndex(item => item.imageUrl === imageUrl) === -1
				) {
					userRef.update({
						publicGallery: [{ imageUrl }, ...userData.publicGallery],
					})
					return true;
				}
			}
			return false;
		} catch (error) {
			throw new HttpException(
				error.message,
				error.status
			)
		}
	}

	async removeImageFromPublicGallery(
		userId: string,
		imageUrl: string,
	): Promise<boolean> {
		try {
			const userRef = this.db.collection('users').doc(userId);
			const userDoc = await userRef.get();

			if (!userDoc.exists) {
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			}

			const userData = userDoc.data();
			if (userData) {
				if (
					userData.publicGallery.findIndex(item => item.imageUrl === imageUrl) !== -1
				) {
					const updatedGallery = userData.publicGallery.filter(
						(item: { imageUrl: string }) => item.imageUrl !== imageUrl
					);

					await userRef.update({
						publicGallery: updatedGallery,
					});

					return true;
				}
			}
			return false;
		} catch (error) {
			throw new HttpException(error.message, error.status);
		}
	}

}
