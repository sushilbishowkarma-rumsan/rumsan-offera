import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Optional: useful if you have hanging connections during dev watch mode
    forceCloseConnections: true,
  });
  // 1. Global Prefix (Good practice for API versioning)
  app.setGlobalPrefix('api/v1');

  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://offera-app-frontend.vercel.app', // ✅ Add your Vercel domain
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // 3. ENABLE SHUTDOWN HOOKS (Crucial for Prisma v5)
  // This allows the PrismaService.onModuleDestroy() we wrote to fire
  app.enableShutdownHooks();

  // 2. Global Validation (Essential for your User model)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4001;

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
}
bootstrap();
