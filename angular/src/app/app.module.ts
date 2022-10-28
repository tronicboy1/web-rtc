import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AuthComponent } from "./pages/auth/auth.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { ContactsComponent } from './pages/contacts/contacts.component';

@NgModule({
  declarations: [AppComponent, AuthComponent, PageNotFoundComponent, ContactsComponent],
  imports: [BrowserModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
