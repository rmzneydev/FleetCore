import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service.js';
import { Public } from './common/decorators/public.decorator.js';
import { ApiEnvelopeResponse } from './common/swagger/api-responses.decorator.js';

@Controller()
@ApiTags('Health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Comprobar que la API está disponible (público)' })
  @ApiEnvelopeResponse(200, 'API disponible')
  getHello(): string {
    return this.appService.getHello();
  }
}
