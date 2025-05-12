import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService {
	private logger = new Logger(FirebaseService.name)
	private firebaseApp: admin.app.App;

	constructor() {
		this.initializeFirebase();
	}

	private initializeFirebase() {
		try {
			this.firebaseApp = admin.initializeApp({
				credential: admin.credential.cert('firebaseServiceAccountKey.json'),
			})
			this.logger.debug('Firebase app created successfully');
		} catch (e) {
			this.logger.error('Firebase app created failed', e);
		}
	}

	getFirestore(): FirebaseFirestore.Firestore {
		return admin.firestore();
	}

	getAuth(): admin.auth.Auth {
		return admin.auth();
	}
}
