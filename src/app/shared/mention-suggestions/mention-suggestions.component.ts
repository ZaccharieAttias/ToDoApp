import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface User {
  id: string;
  displayName: string;
}

@Component({
  selector: 'app-mention-suggestions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="mention-suggestions"
      *ngIf="suggestions.length > 0"
      [style.top.px]="top"
      [style.left.px]="left"
    >
      <div class="suggestions-container">
        <div
          *ngFor="let user of visibleSuggestions"
          class="suggestion-item"
          [class.selected]="selectedIndex === suggestions.indexOf(user)"
          (click)="onSelect(user)"
          (mouseenter)="selectedIndex = suggestions.indexOf(user)"
        >
          {{ user.displayName }}
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .mention-suggestions {
        position: absolute;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        z-index: 1000;
        width: 200px;
      }
      .suggestions-container {
        max-height: 200px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #888 #f1f1f1;
      }
      .suggestions-container::-webkit-scrollbar {
        width: 6px;
      }
      .suggestions-container::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      .suggestions-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 3px;
      }
      .suggestions-container::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
      .suggestion-item {
        padding: 8px 12px;
        cursor: pointer;
        transition: background-color 0.2s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .suggestion-item:hover,
      .suggestion-item.selected {
        background-color: #f0f0f0;
      }
    `,
  ],
})
export class MentionSuggestionsComponent {
  @Input() suggestions: User[] = [];
  @Input() top: number = 0;
  @Input() left: number = 0;
  @Output() select = new EventEmitter<User>();

  selectedIndex = 0;

  get visibleSuggestions(): User[] {
    return this.suggestions.slice(0, 5);
  }

  onSelect(user: User) {
    this.select.emit(user);
  }

  moveSelection(direction: 'up' | 'down') {
    if (this.suggestions.length === 0) return;

    if (direction === 'up') {
      this.selectedIndex =
        this.selectedIndex > 0
          ? this.selectedIndex - 1
          : this.suggestions.length - 1;
    } else {
      this.selectedIndex =
        this.selectedIndex < this.suggestions.length - 1
          ? this.selectedIndex + 1
          : 0;
    }
  }

  getSelectedUser(): User | null {
    return this.suggestions[this.selectedIndex] || null;
  }
}
