import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { AuthComponent } from "./pages/auth/auth.component";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { ContactsComponent } from "./pages/contacts/contacts.component";
import { CallComponent } from "./pages/call/call.component";
import { RtcService } from "@services/rtc.service";
import { ServiceWorkerModule } from "@angular/service-worker";
import { environment } from "../environments/environment";

@NgModule({
  declarations: [AppComponent, AuthComponent, PageNotFoundComponent, ContactsComponent, CallComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    ServiceWorkerModule.register("custom-sw.js", {
      /** Setting SW to true in dev will cause long reload on all changes. */
      enabled: environment.production,
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
  providers: [RtcService],
  bootstrap: [AppComponent],
  /** Adding custom Elements Schema allows use of custom tags i.e. Web Components. */
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
