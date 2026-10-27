import {
  Component,
  Input,
  signal,
  computed,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ia-sql-results',
  templateUrl: './sql-results.component.html',
  styleUrls: ['./sql-results.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SqlResultsComponent implements OnChanges {
  @Input() rawData: Record<string, unknown>[] = [];
  @Input() displayedColumns: string[] = [];
  @Input() isLoading = false;
  @Input() elapsedMs = 0;
  @Input() executionMs: number | null = null;
  @Input() errorText: string | null = null;
  @Input() rowsAffected: number | null = null;
  @Input() truncated = false;
  @Input() emptyResult = false;
  @Input() pageSize = 100;

  readonly sortColumn = signal<string | null>(null);
  readonly sortDirection = signal<'asc' | 'desc'>('asc');
  readonly currentPage = signal(0);
  readonly copiedCell = signal<string | null>(null);

  private rawDataSignal = signal<Record<string, unknown>[]>([]);

  readonly sortedData = computed(() => {
    const data = [...this.rawDataSignal()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    if (!col) return data;
    return data.sort((a, b) => {
      const av = a[col], bv = b[col];
      if (av == null && bv == null) return 0;
      if (av == null) return dir === 'asc' ? -1 : 1;
      if (bv == null) return dir === 'asc' ? 1 : -1;
      const an = typeof av === 'number' ? av : Number(av);
      const bn = typeof bv === 'number' ? bv : Number(bv);
      if (!Number.isNaN(an) && !Number.isNaN(bn)) return dir === 'asc' ? an - bn : bn - an;
      const as = String(av).toLowerCase(), bs = String(bv).toLowerCase();
      if (as < bs) return dir === 'asc' ? -1 : 1;
      if (as > bs) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  });

  readonly pagedData = computed(() => {
    const start = this.currentPage() * this.pageSize;
    return this.sortedData().slice(start, start + this.pageSize);
  });

  readonly totalPages = computed(() =>
    Math.ceil(this.rawDataSignal().length / this.pageSize)
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['rawData']) {
      this.rawDataSignal.set(this.rawData);
      this.currentPage.set(0);
      this.sortColumn.set(null);
      this.sortDirection.set('asc');
    }
  }

  formatMs(ms: number): string {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
  }

  onSort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.currentPage.set(0);
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

  copyCellValue(value: unknown, cellKey: string): void {
    const text = value != null ? String(value) : '';
    const fallback = () => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch {}
      document.body.removeChild(ta);
    };
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(fallback);
    } else {
      fallback();
    }
    this.copiedCell.set(cellKey);
    setTimeout(() => this.copiedCell.set(null), 1000);
  }
}
