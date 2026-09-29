import { Module } from '@nestjs/common';

import { DataModule } from '../data/data.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [DataModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}