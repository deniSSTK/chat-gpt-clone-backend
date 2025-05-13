import * as cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as process from 'node:process';
import { Logger } from '@nestjs/common';

const logger = new Logger('main.ts')

dotenv.config()

logger.debug(process.env.CLIENT_URL)
logger.debug(process.env.NODE_ENV);

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
