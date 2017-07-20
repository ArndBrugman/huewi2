import { NgModule } from '@angular/core';

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'HuewiGroupsFilter' })
export class HuewiGroupsFilter implements PipeTransform {
    transform(groups: Array<any>, type: string) {
        if (type === 'Rooms') {
          return groups.filter(group => group.type === 'Room');
        } else if (type === 'Groups') {
          return groups.filter(group => group.type === 'LightGroup');
        } else {
          return groups;
        }
    }
}
