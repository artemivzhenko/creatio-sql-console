import {
  Component,
  Output,
  EventEmitter,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  NgZone,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { basicSetup, EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { keymap } from '@codemirror/view';

interface ConsoleTab {
  id: string;
  label: string;
  queryText: string;
}

@Component({
  selector: 'ia-sql-editor',
  templateUrl: './sql-editor.component.html',
  styleUrls: ['./sql-editor.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class SqlEditorComponent implements AfterViewInit, OnDestroy {
  @Output() queryReady = new EventEmitter<string>();
  @Output() queryChanged = new EventEmitter<string>();
  @Output() execute = new EventEmitter<string>();
  @Output() save = new EventEmitter<string>();

  @ViewChild('editor', { static: true }) editorContainer!: ElementRef<HTMLElement>;

  private readonly zone = inject(NgZone);
  private readonly storageKey = 'ia-sql-console-tabs';
  private editorView!: EditorView;

  readonly maxTabs = 10;
  tabs = signal<ConsoleTab[]>([]);
  activeTabId = signal<string>('');
  editingTabId = signal<string | null>(null);
  editingLabel = '';

  ngAfterViewInit(): void {
    const saved = this.loadTabsFromStorage();

    if (saved.tabs.length > 0) {
      this.tabs.set(saved.tabs);
      this.activeTabId.set(saved.activeTabId);
    } else {
      const first = this.newTab(1);
      this.tabs.set([first]);
      this.activeTabId.set(first.id);
    }

    const activeTab = this.tabs().find(t => t.id === this.activeTabId())!;

    this.zone.runOutsideAngular(() => {
      this.editorView = new EditorView({
        state: this.buildEditorState(activeTab.queryText),
        parent: this.editorContainer.nativeElement
      });
    });

    setTimeout(() => {
      const text = this.editorView.state.doc.toString();
      this.queryReady.emit(text);
    }, 0);
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
  }

  // ── Tabs ───────────────────────────────────────────────────────────────────

  addTab(): void {
    if (this.tabs().length >= this.maxTabs) return;
    this.flushActiveTab();
    const tab = this.newTab(this.tabs().length + 1);
    this.tabs.update(tabs => [...tabs, tab]);
    this.activeTabId.set(tab.id);
    this.editorView.setState(this.buildEditorState(''));
    this.queryChanged.emit('');
    this.persistTabs();
  }

  closeTab(tabId: string, event?: MouseEvent): void {
    event?.stopPropagation();
    const tabs = this.tabs();
    if (tabs.length <= 1) return;
    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);
    if (tabId === this.activeTabId()) {
      const next = newTabs[Math.min(idx, newTabs.length - 1)];
      this.activeTabId.set(next.id);
      this.editorView.setState(this.buildEditorState(next.queryText));
      this.queryChanged.emit(next.queryText);
    }
    this.tabs.set(newTabs);
    this.persistTabs();
  }

  switchTab(tabId: string): void {
    if (tabId === this.activeTabId()) return;
    this.flushActiveTab();
    this.activeTabId.set(tabId);
    const tab = this.tabs().find(t => t.id === tabId)!;
    this.editorView.setState(this.buildEditorState(tab.queryText));
    this.queryChanged.emit(tab.queryText);
    this.persistTabs();
  }

  startEditing(tab: ConsoleTab, event: MouseEvent): void {
    event.stopPropagation();
    this.editingTabId.set(tab.id);
    this.editingLabel = tab.label;
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('.tab-name-input');
      input?.focus();
      input?.select();
    });
  }

  finishEditing(tabId: string): void {
    const label = this.editingLabel.trim();
    if (label) {
      this.tabs.update(tabs => tabs.map(t => t.id === tabId ? { ...t, label } : t));
      this.persistTabs();
    }
    this.editingTabId.set(null);
  }

  cancelEditing(): void {
    this.editingTabId.set(null);
  }

  // ── Editor ─────────────────────────────────────────────────────────────────

  private buildEditorState(doc: string): EditorState {
    return EditorState.create({
      doc,
      extensions: [
        keymap.of([
          {
            key: 'Mod-Enter',
            run: () => {
              this.zone.run(() => this.execute.emit(this.editorView.state.doc.toString()));
              return true;
            }
          },
          {
            key: 'Mod-Shift-x',
            run: view => {
              view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: '' } });
              this.zone.run(() => {
                this.queryChanged.emit('');
                this.persistTabs();
              });
              return true;
            }
          },
          {
            key: 'Mod-Shift-s',
            run: () => {
              this.zone.run(() => this.save.emit(this.editorView.state.doc.toString()));
              return true;
            }
          }
        ]),
        basicSetup,
        sql(),
        EditorView.updateListener.of(u => {
          if (u.docChanged) {
            this.zone.run(() => {
              this.queryChanged.emit(u.state.doc.toString());
              this.persistTabs();
            });
          }
        })
      ]
    });
  }

  // ── Storage ────────────────────────────────────────────────────────────────

  private loadTabsFromStorage(): { tabs: ConsoleTab[]; activeTabId: string } {
    try {
      if (typeof window === 'undefined') return { tabs: [], activeTabId: '' };
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return { tabs: [], activeTabId: '' };
      const parsed = JSON.parse(raw);
      const tabs: ConsoleTab[] = (parsed.tabs ?? []).map((t: any) => ({
        id: t.id,
        label: t.label,
        queryText: t.queryText ?? ''
      }));
      return { tabs, activeTabId: parsed.activeTabId ?? tabs[0]?.id ?? '' };
    } catch {
      return { tabs: [], activeTabId: '' };
    }
  }

  private persistTabs(): void {
    try {
      if (typeof window === 'undefined') return;
      const activeId = this.activeTabId();
      window.localStorage.setItem(this.storageKey, JSON.stringify({
        activeTabId: activeId,
        tabs: this.tabs().map(t => ({
          id: t.id,
          label: t.label,
          queryText: t.id === activeId
            ? (this.editorView?.state.doc.toString() ?? t.queryText)
            : t.queryText
        }))
      }));
    } catch {}
  }

  private flushActiveTab(): void {
    const tabs = this.tabs();
    const idx = tabs.findIndex(t => t.id === this.activeTabId());
    if (idx === -1) return;
    const newTabs = [...tabs];
    newTabs[idx] = { ...tabs[idx], queryText: this.editorView?.state.doc.toString() ?? tabs[idx].queryText };
    this.tabs.set(newTabs);
  }

  private newTab(index: number): ConsoleTab {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
    return { id, label: `Tab ${index}`, queryText: '' };
  }
}
