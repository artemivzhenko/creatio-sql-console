import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import { DoBootstrap, ErrorHandler, Injector, NgModule, ProviderToken } from '@angular/core';
import { bootstrapCrtModule, CrtModule } from '@creatio-devkit/common';
import { SqlConsoleComponent } from './view-elements/sql-console/sql-console.component';

class ZoneCompatErrorHandler implements ErrorHandler {
  handleError(err: unknown): void {
    if (err instanceof Error && err.message.includes('NG0909')) return;
    console.error(err);
  }
}

@CrtModule({
  viewElements: [SqlConsoleComponent],
})
@NgModule({
  declarations: [],
  imports: [BrowserModule, SqlConsoleComponent],
  providers: [{ provide: ErrorHandler, useClass: ZoneCompatErrorHandler }],
})
export class AppModule implements DoBootstrap {
  constructor(private _injector: Injector) {}

  ngDoBootstrap(): void {
    const element = createCustomElement(SqlConsoleComponent, {
      injector: this._injector,
    });
    customElements.define('ia-sqlconsole', element);

    bootstrapCrtModule('ia_sql_console', AppModule, {
      resolveDependency: (token) => this._injector.get(<ProviderToken<unknown>>token),
    });
  }
}
