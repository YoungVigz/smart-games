import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.use(cookieParser());
	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
	app.useGlobalFilters(new GlobalExceptionFilter());
	app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

	const config = new DocumentBuilder()
		.setTitle('Smart games API')
		.setDescription('Communication platform for puzzle games')
		.setVersion('1.0')
		.addBearerAuth()
		.build();

	const document = SwaggerModule.createDocument(app, config);

	app.use('/openapi.json', (req, res) => res.json(document));

	app.use(
		'/docs',
		apiReference({
			url: '/openapi.json',
			theme: 'purple',
		}),
	);

	app.enableCors({
		origin: process.env.FRONT_URL,
		credentials: true,
	});

	await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
