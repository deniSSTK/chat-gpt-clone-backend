import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseModule } from './firebase/firebase.module';
import { AuthenticationModule } from './authentication/authentication.module';
import { ChatsModule } from './chats/chats.module';
import { PersonalizationModule } from './personalization/personalization.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        FirebaseModule,
        AuthenticationModule,
        ChatsModule,
        PersonalizationModule,
    ],
})
export class AppModule {}
