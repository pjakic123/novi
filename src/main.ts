import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StorageConfig } from 'config/storage.config';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(StorageConfig.photo.destination, {
    prefix: StorageConfig.photo.urlPrefix,
    maxAge: StorageConfig.photo.maxAge,
    index: false,
  })

  await app.listen(3000);
}
bootstrap();
