import { Module } from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { AuthenticationController } from './authentication.controller';
import { FirebaseModule } from '../firebase/firebase.module';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [FirebaseModule, ConfigModule],
  providers: [AuthenticationService, JwtStrategy],
  controllers: [AuthenticationController],
  exports: [JwtStrategy],
})
export class AuthenticationModule {}
