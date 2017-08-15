import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filter', pure: false })
export class FilterPipe implements PipeTransform {
    transform(items: any, filter: string, field: string): any {
        if (filter && Array.isArray(items)) {
            filter = filter.toLowerCase();
            if (field) {
                return items.filter(item => { return item[field].toLowerCase().indexOf(filter)>=0 } );
            } else {
                return items.filter(item => { return JSON.stringify(item).indexOf(filter)>=0 } );
            }
        } else {
            return items;
        }
    }
}

@NgModule({
    imports: [CommonModule],
    declarations: [FilterPipe],
    exports: [FilterPipe],
})

export class FilterModule { }
