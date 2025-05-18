import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlightMention'
})
export class HighlightMentionPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
