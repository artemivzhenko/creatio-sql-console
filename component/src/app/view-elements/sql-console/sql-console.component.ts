import {
  Component,
  Input,
  signal,
  Output,
  EventEmitter,
  NgZone,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CrtInput, CrtOutput, CrtViewElement } from '@creatio-devkit/common';
import { SqlEditorComponent } from '../sql-editor/sql-editor.component';
import { SqlResultsComponent } from '../sql-results/sql-results.component';

export type QueryResult = {
  success: boolean;
  type: 'DataSet' | 'NonQuery';
  columns?: string[];
  rows?: unknown[][];
  truncated?: boolean;
  rowsAffected?: number;
  error?: string;
};

@Component({
  selector: 'ia-sqlconsole',
  templateUrl: './sql-console.component.html',
  styleUrls: ['./sql-console.component.css'],
  standalone: true,
  imports: [CommonModule, SqlEditorComponent, SqlResultsComponent]
})
@CrtViewElement({
  selector: 'ia-sqlconsole',
  type: 'ia.SqlConsole'
})
export class SqlConsoleComponent {
  @Input() @CrtInput()
  sqlQuery: string = '';

  @Output() @CrtOutput()
  sqlQueryChange = new EventEmitter<string>();

  @Output() @CrtOutput()
  executeQuery = new EventEmitter<string>();

  @Output() @CrtOutput()
  saveQuery = new EventEmitter<string>();

  @Input() @CrtInput()
  // The page sets { pending: true } before calling the service, so its Execute button shows the spinner too.
  set queryResult(value: QueryResult | { pending: true } | null) {
    if (!value) return;
    if ('pending' in value) {
      if (!this.isLoading()) {
        this.clearResult();
        this.startTimer();
      }
      return;
    }
    this.applyResult(value);
  }

  private readonly zone = inject(NgZone);

  isLoading = signal(false);
  elapsedMs = signal(0);
  executionMs = signal<number | null>(null);

  rawData = signal<Record<string, unknown>[]>([]);
  displayedColumns = signal<string[]>([]);
  rowsAffected = signal<number | null>(null);
  errorText = signal<string | null>(null);
  truncated = signal(false);
  emptyResult = signal(false);

  private queryStartTime = 0;
  private timerRef: any = null;

  onQueryReady(text: string): void {
    this.sqlQuery = text;
    this.sqlQueryChange.emit(text);
  }

  onQueryChanged(text: string): void {
    this.sqlQuery = text;
    this.sqlQueryChange.emit(text);
  }

  onExecute(queryText: string): void {
    this.clearResult();

    if (!queryText.trim()) {
      this.errorText.set('Query text cannot be empty.');
      return;
    }

    this.sqlQuery = queryText;
    this.startTimer();
    this.sqlQueryChange.emit(queryText);
    this.executeQuery.emit(queryText);
  }

  onSave(queryText: string): void {
    this.saveQuery.emit(queryText);
  }

  private clearResult(): void {
    this.errorText.set(null);
    this.rawData.set([]);
    this.rowsAffected.set(null);
    this.displayedColumns.set([]);
    this.truncated.set(false);
    this.emptyResult.set(false);
  }

  private applyResult(result: QueryResult): void {
    this.stopTimer();
    this.clearResult();

    if (!result.success) {
      this.errorText.set(result.error || 'Unknown error');
      return;
    }

    if (result.type === 'DataSet' && Array.isArray(result.rows)) {
      const columns = result.columns ?? [];
      this.rawData.set(this.processRows(columns, result.rows));
      this.displayedColumns.set(columns);
      this.truncated.set(!!result.truncated);
      this.emptyResult.set(result.rows.length === 0);
    } else if (result.type === 'NonQuery') {
      this.rowsAffected.set(result.rowsAffected ?? 0);
    } else {
      this.errorText.set('Unsupported response type.');
    }
  }

  private processRows(columns: string[], rows: unknown[][]): Record<string, unknown>[] {
    return rows.map(row => {
      const record: Record<string, unknown> = {};
      columns.forEach((column, i) => {
        const v = row[i];
        if (typeof v === 'string' && v.startsWith('/Date(') && v.endsWith(')/')) {
          const plus = v.indexOf('+', 6);
          const ms = plus > 0 ? v.slice(6, plus) : v.slice(6, v.length - 2);
          const d = new Date(parseInt(ms, 10));
          record[column] = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ` +
                 `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`;
        } else {
          record[column] = v;
        }
      });
      return record;
    });
  }

  private startTimer(): void {
    this.queryStartTime = Date.now();
    this.elapsedMs.set(0);
    this.isLoading.set(true);
    this.executionMs.set(null);
    this.zone.runOutsideAngular(() => {
      this.timerRef = setInterval(() => {
        this.zone.run(() => this.elapsedMs.set(Date.now() - this.queryStartTime));
      }, 100);
    });
  }

  private stopTimer(): void {
    if (this.timerRef) {
      clearInterval(this.timerRef);
      this.timerRef = null;
    }
    if (this.isLoading()) {
      this.executionMs.set(Date.now() - this.queryStartTime);
      this.isLoading.set(false);
    }
  }
}
