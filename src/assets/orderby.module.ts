import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderByPipe } from './../assets/orderby';

@NgModule({
  imports: [ CommonModule ],
  declarations: [ OrderByPipe ],
  exports: [ OrderByPipe ],
})

export class OrderByModule { }
