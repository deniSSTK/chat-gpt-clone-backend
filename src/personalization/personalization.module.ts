import { Module } from '@nestjs/common';
import { PersonalizationController } from './personalization.controller';
import { PersonalizationService } from './personalization.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [FirebaseModule],
  controllers: [PersonalizationController],
  providers: [PersonalizationService]
})
export class PersonalizationModule {}
