import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { AuthGuard } from "./auth.guard";
import { InRoomGuard } from "./in-room.guard";
import { PageNotFoundComponent } from "./page-not-found/page-not-found.component";
import { AuthComponent } from "./pages/auth/auth.component";
import { CallComponent } from "./pages/call/call.component";
import { ChatComponent } from "./pages/chat/chat.component";
import { ContactsComponent } from "./pages/contacts/contacts.component";

export type CallQueryParameters = { "their-uid": string; polite: number; "is-video": number };

const routes: Routes = [
  {
    path: "chat/:roomId",
    component: ChatComponent,
    canActivate: [AuthGuard, InRoomGuard],
    data: { animation: ChatComponent.name },
  },
  {
    path: "contacts",
    component: ContactsComponent,
    canActivate: [AuthGuard],
    data: { animation: ContactsComponent.name },
  },
  { path: "auth", component: AuthComponent, data: { animation: AuthComponent.name } },
  { path: "call", component: CallComponent, canActivate: [AuthGuard], data: { animation: CallComponent.name } },
  { path: "", redirectTo: "/auth", pathMatch: "full" },
  { path: "**", component: PageNotFoundComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
