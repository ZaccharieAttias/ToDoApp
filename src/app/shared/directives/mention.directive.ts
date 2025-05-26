import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  ViewContainerRef,
  ComponentRef,
  OnDestroy,
} from '@angular/core';
import { MentionSuggestionsComponent } from '../mention-suggestions/mention-suggestions.component';
import { AuthService } from '../../services/auth.service';
import { take } from 'rxjs/operators';

@Directive({
  selector: '[appMentionDirective]',
  standalone: true,
})
export class MentionDirective implements OnDestroy {
  @Output() mentionDetected = new EventEmitter<string>();
  private suggestionsComponent: ComponentRef<MentionSuggestionsComponent> | null =
    null;
  private currentMention = '';
  private isNavigating = false;

  constructor(
    private el: ElementRef,
    private viewContainerRef: ViewContainerRef,
    private authService: AuthService
  ) {}

  ngOnDestroy() {
    this.removeSuggestions();
  }

  @HostListener('input', ['$event'])
  onInput(event: InputEvent) {
    const textarea = this.el.nativeElement as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const text = textarea.value;

    let mentionStart = cursorPosition;
    while (
      mentionStart > 0 &&
      text[mentionStart - 1] !== ' ' &&
      text[mentionStart - 1] !== '@'
    ) {
      mentionStart--;
    }

    if (mentionStart > 0 && text[mentionStart - 1] === '@') {
      this.currentMention = text.slice(mentionStart, cursorPosition);
      this.showSuggestions(textarea, cursorPosition);
    } else {
      this.removeSuggestions();
    }
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (!this.suggestionsComponent) return;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        this.isNavigating = true;
        this.suggestionsComponent.instance.moveSelection('up');
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.isNavigating = true;
        this.suggestionsComponent.instance.moveSelection('down');
        break;
      case 'Enter':
      case 'Tab':
        event.preventDefault();
        const selectedUser =
          this.suggestionsComponent.instance.getSelectedUser();
        if (selectedUser) {
          this.insertMention(selectedUser);
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.removeSuggestions();
        break;
      default:
        this.isNavigating = false;
    }
  }

  @HostListener('blur')
  onBlur() {
    setTimeout(() => {
      if (!this.isNavigating) {
        this.removeSuggestions();
      }
    }, 200);
  }

  private showSuggestions(
    textarea: HTMLTextAreaElement,
    cursorPosition: number
  ) {
    const rect = this.getCaretCoordinates(textarea, cursorPosition);

    this.authService
      .getUsers()
      .pipe(take(1))
      .subscribe((users) => {
        const filteredUsers = users.filter((user) =>
          user.displayName
            .toLowerCase()
            .includes(this.currentMention.toLowerCase())
        );
        if (this.suggestionsComponent) {
          this.suggestionsComponent.instance.suggestions = filteredUsers;
        }
      });

    if (!this.suggestionsComponent) {
      this.suggestionsComponent = this.viewContainerRef.createComponent(
        MentionSuggestionsComponent
      );
      this.suggestionsComponent.instance.select.subscribe((user) => {
        this.insertMention(user);
      });
    }

    this.suggestionsComponent.instance.top = rect.top + 40;
    this.suggestionsComponent.instance.left = rect.left + 15;
  }

  private removeSuggestions() {
    if (this.suggestionsComponent) {
      this.suggestionsComponent.destroy();
      this.suggestionsComponent = null;
    }
  }

  private insertMention(user: { id: string; displayName: string }) {
    const textarea = this.el.nativeElement as HTMLTextAreaElement;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;

    let mentionStart = cursorPosition;
    while (
      mentionStart > 0 &&
      text[mentionStart - 1] !== ' ' &&
      text[mentionStart - 1] !== '@'
    ) {
      mentionStart--;
    }
    if (mentionStart > 0 && text[mentionStart - 1] === '@') {
      mentionStart--;
    }

    const newText =
      text.slice(0, mentionStart) +
      `@${user.displayName} ` +
      text.slice(cursorPosition);

    textarea.value = newText;

    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);

    const newCursorPosition = mentionStart + user.displayName.length + 2;
    textarea.setSelectionRange(newCursorPosition, newCursorPosition);

    this.mentionDetected.emit(user.displayName);

    this.removeSuggestions();
  }

  private getCaretCoordinates(element: HTMLTextAreaElement, position: number) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);

    // Copier les styles pertinents
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordWrap = 'break-word';
    div.style.width = style.width;
    div.style.height = style.height;
    div.style.padding = style.padding;
    div.style.border = style.border;
    div.style.font = style.font;
    div.style.lineHeight = style.lineHeight;

    // Créer un span pour marquer la position
    const span = document.createElement('span');
    const text = element.value;
    div.textContent = text.substring(0, position);
    div.appendChild(span);
    div.textContent += text.substring(position);

    document.body.appendChild(div);
    const coordinates = {
      top: span.offsetTop + element.offsetTop,
      left: span.offsetLeft + element.offsetLeft,
    };
    document.body.removeChild(div);

    return coordinates;
  }
}
