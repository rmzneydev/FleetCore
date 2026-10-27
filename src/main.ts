import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors({
    origin: config
      .getOrThrow<string>('CORS_ORIGINS')
      .split(',')
      .map((origin) => origin.trim()),
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FleetCore API')
    .setDescription(
      'API REST de gestión de flota. Las respuestas exitosas usan { success, statusCode, data, timestamp }; los errores usan { success, statusCode, message, path, timestamp }. Las rutas privadas requieren Bearer JWT y autorización por rol. La consulta de integración requiere el esquema x-api-key.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', in: 'header', name: 'x-api-key' }, 'x-api-key')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  await app.listen(Number(config.get<string>('PORT', '3000')));
}
await bootstrap();
