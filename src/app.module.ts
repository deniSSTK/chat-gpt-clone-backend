import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthenticationModule } from './authentication/authentication.module';

@Module({
    imports: [FirebaseModule, AuthenticationModule],
})
export class AppModule {}
