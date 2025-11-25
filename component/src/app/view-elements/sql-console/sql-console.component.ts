import {
  Component,
  Input,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientService } from '@creatio-devkit/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';

import { basicSetup, EditorView } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { sql } from '@codemirror/lang-sql';
import { CrtViewElement } from '@creatio-devkit/common';
import { keymap } from '@codemirror/view';

type QueryResult = {
  success: boolean;
  type: 'DataSet' | 'NonQuery';
  data?: Record<string, unknown>[] | any[];
  rowsAffected?: number;
  error?: string;
};

@Component({
  selector: 'ia-sql-console-component',
  templateUrl: './sql-console.component.html',
  styleUrls: ['./sql-console.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatTableModule
  ]
})
@CrtViewElement({
  selector: 'ia-sqlconsole',
  type: 'ia.SqlConsole'
})
export class SqlConsoleComponent implements AfterViewInit, OnDestroy {
  @Input() pageSize = 100;

  @ViewChild('editor', { static: true }) editorContainer!: ElementRef<HTMLElement>;

  editorView!: EditorView;

  private readonly storageKey = 'ia-sql-console-last-query';

  queryText = '';
  rawData = signal<Record<string, unknown>[]>([]);
  rowsAffected = signal<number | null>(null);
  errorText = signal<string | null>(null);
  currentPage = signal(0);
  displayedColumns = signal<string[]>([]);
  dataSource = new MatTableDataSource<Record<string, unknown>>([]);

  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('asc');

  readonly sortedData = computed(() => {
    const data = [...this.rawData()];
    const col = this.sortColumn();
    const dir = this.sortDirection();

    if (!col) {
      return data;
    }

    return data.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const av = a[col];
      const bv = b[col];

      if (av == null && bv == null) {
        return 0;
      }
      if (av == null) {
        return dir === 'asc' ? -1 : 1;
      }
      if (bv == null) {
        return dir === 'asc' ? 1 : -1;
      }

      const an = typeof av === 'number' ? av : Number(av);
      const bn = typeof bv === 'number' ? bv : Number(bv);

      if (!Number.isNaN(an) && !Number.isNaN(bn)) {
        return dir === 'asc' ? an - bn : bn - an;
      }

      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();

      if (as < bs) {
        return dir === 'asc' ? -1 : 1;
      }
      if (as > bs) {
        return dir === 'asc' ? 1 : -1;
      }
      return 0;
    });
  });

  readonly pagedData = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.sortedData().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.rawData().length / this.pageSize)
  );

  ngAfterViewInit(): void {
    this.loadQueryFromStorage();

    const state = EditorState.create({
      doc: this.queryText,
      extensions: [
        basicSetup,
        sql(),
        keymap.of([
          {
            key: 'Mod-z',
            run: () => {
              this.execute();
              return true;
            }
          },
          {
            key: 'Mod-x',
            run: view => {
              view.dispatch({
                changes: { from: 0, to: view.state.doc.length, insert: '' }
              });
              this.queryText = '';
              this.saveQueryToStorage();
              return true;
            }
          }
        ]),
        EditorView.updateListener.of(u => {
          if (u.docChanged) {
            this.queryText = u.state.doc.toString();
            this.saveQueryToStorage();
          }
        })
      ]
    });

    this.editorView = new EditorView({
      state,
      parent: this.editorContainer.nativeElement
    });
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
  }

  private loadQueryFromStorage(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      const stored = window.localStorage.getItem(this.storageKey);
      if (stored !== null) {
        this.queryText = stored;
      }
    } catch {
    }
  }

  private saveQueryToStorage(): void {
    try {
      if (typeof window === 'undefined') {
        return;
      }
      window.localStorage.setItem(this.storageKey, this.queryText ?? '');
    } catch {
    }
  }

  async execute(): Promise<void> {
    this.errorText.set(null);
    this.rawData.set([]);
    this.rowsAffected.set(null);
    this.displayedColumns.set([]);
    this.currentPage.set(0);
    this.sortColumn.set(null);
    this.sortDirection.set('asc');

    if (!this.queryText || !this.queryText.trim()) {
      this.errorText.set('Query text cannot be empty.');
      return;
    }

    const http = new HttpClientService();

    try {
      const resp: any = await http.post(
        '/rest/iaQueryService/ExecuteQuery',
        { queryText: this.queryText },
        {}
      );

      const result: QueryResult =
        resp?.body?.ExecuteQueryResult ?? resp?.body ?? resp;

      if (!result || result.success === false) {
        this.errorText.set(result?.error || 'Unknown error');
        return;
      }

      if (result.type === 'DataSet' && Array.isArray(result.data)) {
        let rows: any[] = result.data;

        if (Array.isArray(rows[0])) {
          rows = rows.map((row: any[]) =>
            row.reduce((acc: any, kv: any) => {
              const k = kv.Key ?? kv.key ?? kv[0];
              acc[k] = kv.Value ?? kv.value ?? kv[1];
              return acc;
            }, {})
          );
        }

        rows = rows.map(r => {
          Object.keys(r).forEach(k => {
            const v = r[k];
            if (typeof v === 'string' && v.startsWith('/Date(') && v.endsWith(')/')) {
              const plusIndex = v.indexOf('+', 6);
              const msPart = plusIndex > 0
                ? v.slice(6, plusIndex)
                : v.slice(6, v.length - 2);
              const ms = parseInt(msPart, 10);
              const d = new Date(ms);
              r[k] =
                d.getFullYear() +
                '-' +
                String(d.getMonth() + 1).padStart(2, '0') +
                '-' +
                String(d.getDate()).padStart(2, '0') +
                ' ' +
                String(d.getHours()).padStart(2, '0') +
                ':' +
                String(d.getMinutes()).padStart(2, '0') +
                ':' +
                String(d.getSeconds()).padStart(2, '0');
            }
          });
          return r;
        });

        const tableRows = rows as Record<string, unknown>[];
        this.rawData.set(tableRows);

        if (tableRows.length) {
          this.displayedColumns.set(Object.keys(tableRows[0]));
          this.updateDataSource();
        } else {
          this.updateDataSource();
        }
      } else if (result.type === 'NonQuery') {
        this.rowsAffected.set(result.rowsAffected ?? 0);
        this.updateDataSource();
      } else {
        this.errorText.set('Unsupported response type.');
      }
    } catch (e: any) {
      this.errorText.set(e?.message ?? 'Network error');
    }
  }

  updateDataSource(): void {
    this.dataSource = new MatTableDataSource(this.pagedData());
  }

  next(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
      this.updateDataSource();
    }
  }

  back(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
      this.updateDataSource();
    }
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(0);
    this.updateDataSource();
  }

  exportCsv(): void {
    if (!this.rawData().length) {
      return;
    }
    const cols = this.displayedColumns();
    const lines: string[] = [cols.join(',')];

    for (const row of this.rawData()) {
      lines.push(
        cols
          .map(c => {
            const value = row[c] ?? '';
            return `"${value.toString().replace(/"/g, '""')}"`;
          })
          .join(',')
      );
    }

    const blob = new Blob([lines.join('\r\n')], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_result.csv';
    a.click();
    URL.revokeObjectURL(url);
  }
}
