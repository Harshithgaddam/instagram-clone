import { Module } from '@nestjs/common';

import { DataModule } from '../data/data.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import {AuthModule} from '../auth/auth.module';
@Module({
  imports: [DataModule,AuthModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}