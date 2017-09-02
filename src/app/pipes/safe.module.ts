import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({ name: 'safe' })
export class SafePipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}
  transform(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

@NgModule({
    imports: [CommonModule],
    declarations: [SafePipe],
    exports: [SafePipe],
})

export class SafeModule { }
