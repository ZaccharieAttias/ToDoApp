import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'mention',
  standalone: true,
})
export class MentionPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(value: string, users: string[]): SafeHtml {
    if (!value) return '';
    if (!users || users.length === 0) return value;

    const mentionPattern = /@([\wÀ-ÿ0-9._-]+)/g;

    const highlightedText = value.replace(mentionPattern, (match, p1) => {
      if (users.includes(p1)) {
        return `<span class="mention-highlight">@${p1}</span>`;
      }
      return match;
    });

    return this.sanitizer.bypassSecurityTrustHtml(highlightedText);
  }
}
