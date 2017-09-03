import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrderByPipe } from './orderby.pipe';
import { FilterPipe } from './filter.pipe';
import { SafePipe } from './safe.pipe';

@NgModule({
    imports: [CommonModule],
    declarations: [
        OrderByPipe,
        FilterPipe,
        SafePipe],
    exports: [
        OrderByPipe,
        FilterPipe,
        SafePipe]
})

export class PipesModule { }
