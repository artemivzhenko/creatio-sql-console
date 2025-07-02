import {DoBootstrap, Injector, NgModule, ProviderToken} from '@angular/core';
import { createCustomElement } from '@angular/elements';
import { BrowserModule } from '@angular/platform-browser';
import {bootstrapCrtModule, CrtModule} from '@creatio-devkit/common';
import { SqlConsoleComponent } from './view-elements/sql-console/sql-console.component';

@CrtModule({
  viewElements: [SqlConsoleComponent],
})
@NgModule({
  declarations: [
  ],
  imports: [
    BrowserModule,
    SqlConsoleComponent,
  ],
  providers: [],
})
export class AppModule implements DoBootstrap {
  constructor(private _injector: Injector) {}

  ngDoBootstrap(): void {
    const element = createCustomElement(SqlConsoleComponent, {
      injector: this._injector,
    });
    customElements.define('ia-sqlconsole', element);

    bootstrapCrtModule('ia_sql_console', AppModule, {
      resolveDependency: (token) => this._injector.get(<ProviderToken<unknown>>token)
    });
  }
}