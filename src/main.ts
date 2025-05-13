import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as process from 'node:process';

dotenv.config()

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.use(cookieParser());

    app.enableCors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    });

    await app.listen(process.env.PORT || 3000);
}
bootstrap();
