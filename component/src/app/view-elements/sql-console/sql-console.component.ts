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
import { HttpClientService, SysSettingsService } from '@creatio-devkit/common';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import * as CryptoJS from 'crypto-js';

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
  selector: 'ia-sqlconsole',
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

  queryText = '';
  rawData = signal<Record<string, unknown>[]>([]);
  rowsAffected = signal<number | null>(null);
  errorText = signal<string | null>(null);
  currentPage = signal(0);
  displayedColumns = signal<string[]>([]);

  readonly pagedData = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.rawData().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.rawData().length / this.pageSize)
  );

  ngAfterViewInit(): void {
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
              return true;
            }
          }
        ]),
        EditorView.updateListener.of(update => {
          if (update.docChanged) {
            this.queryText = update.state.doc.toString();
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

  async execute(): Promise<void> {
    this.errorText.set(null);
    this.rawData.set([]);
    this.rowsAffected.set(null);
    this.displayedColumns.set([]);
    this.currentPage.set(0);

    const sysSettingsService = new SysSettingsService();
    const secretSetting = await sysSettingsService.getByCode('iaSQLSecret');
    const secret = secretSetting?.value || '';
    const key = CryptoJS.enc.Utf8.parse(secret.padEnd(32, '0').slice(0, 32));
    const encryptedQuery = CryptoJS.AES.encrypt(
      this.queryText,
      key,
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    ).ciphertext.toString(CryptoJS.enc.Base64);



    const http = new HttpClientService();
    try {
      const resp: any = await http.post(
        '/rest/iaQueryService/ExecuteQuery',
        { queryText: encryptedQuery }, {}
      );
      const result: QueryResult =
      resp?.body?.ExecuteQueryResult ?? resp?.body;

      if (!result?.success) {
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
            if (
              typeof v === 'string' &&
              v.startsWith('/Date(') &&
              v.endsWith(')/')
            ) {
              const ms = parseInt(v.slice(6, v.indexOf('+', 6)), 10);
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
        }
      }
      else if (result.type === 'NonQuery') {
        this.rowsAffected.set(result.rowsAffected ?? 0);
      }
    }
    catch (e: any) {
      this.errorText.set(e.message ?? 'Network error');
    }
  }

  next(): void {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  back(): void {
    if (this.currentPage() > 0) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }
}
