import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderByPipe } from './orderby';

@NgModule({
  imports: [ CommonModule ],
  declarations: [ OrderByPipe ],
  exports: [ OrderByPipe ],
})

export class OrderByModule { }
