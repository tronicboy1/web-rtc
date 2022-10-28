import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./auth.guard";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { AuthComponent } from "./pages/auth/auth.component";
import { ContactsComponent } from "./pages/contacts/contacts.component";

const routes: Routes = [
  { path: "contacts", component: ContactsComponent, canActivate: [AuthGuard] },
  { path: "auth", component: AuthComponent },
  { path: "", redirectTo: "/auth", pathMatch: "full" },
  { path: "**", component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
