import { Module } from '@nestjs/common';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ChatsModule } from './chats/chats.module';

@Module({
    imports: [FirebaseModule, AuthenticationModule, ChatsModule],
})
export class AppModule {}
