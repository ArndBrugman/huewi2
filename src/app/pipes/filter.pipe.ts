import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'filter', pure: false })
export class FilterPipe implements PipeTransform {
    transform(items: any, filter: string, field: string): any {
        if (filter && Array.isArray(items)) {
            filter = filter.toLowerCase();
            if (field) {
                return items.filter(item => item[field].toLowerCase().indexOf(filter) >= 0 );
            } else {
                return items.filter(item => JSON.stringify(item).indexOf(filter) >= 0 );
            }
        } else {
            return items;
        }
    }
}
