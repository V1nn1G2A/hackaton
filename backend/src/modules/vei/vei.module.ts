import { Module } from '@nestjs/common';
import { VeiController } from './vei.controller';
import { VeiService } from './vei.service';

@Module({
  controllers: [VeiController],
  providers: [VeiService],
})
export class VeiModule {}
