import { OrderByPipe } from './../assets/orderby';

import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [ CommonModule ],
  declarations: [ OrderByPipe ],
  exports: [ OrderByPipe ],
})

export class OrderByModule { }
