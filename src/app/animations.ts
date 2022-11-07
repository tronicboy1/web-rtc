import { animate, animateChild, group, query, style, transition, trigger } from "@angular/animations";
import { AuthComponent } from "./pages/auth/auth.component";
import { CallComponent } from "./pages/call/call.component";
import { ChatComponent } from "./pages/chat/chat.component";
import { ContactsComponent } from "./pages/contacts/contacts.component";

const slideInFromRight = (from: string, to: string) =>
  transition(`${from} => ${to}`, [
    style({ position: "relative" }),
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(":enter", [style({ right: "-100%" })], { optional: true }),
    query(":leave", animateChild(), { optional: true }),
    group([
      query(":leave", [animate("200ms ease-out", style({ left: "-100%", opacity: 0 }))], { optional: true }),
      query(":enter", [animate("300ms ease-out", style({ right: "0%" }))], { optional: true }),
      ///query("@*", animateChild()),
    ]),
  ]);

export const slideInAnimation = trigger("routeAnimations", [
  slideInFromRight(ContactsComponent.name, ChatComponent.name),
  slideInFromRight(ContactsComponent.name, CallComponent.name),
  slideInFromRight(AuthComponent.name, ContactsComponent.name),
  transition("* <=> *", [
    style({ position: "relative" }),
    query(
      ":enter, :leave",
      [
        style({
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
        }),
      ],
      { optional: true },
    ),
    query(":enter", [style({ left: "-100%" })], { optional: true }),
    query(":leave", animateChild(), { optional: true }),
    group([
      query(":leave", [animate("200ms ease-out", style({ left: "100%", opacity: 0 }))], { optional: true }),
      query(":enter", [animate("300ms ease-out", style({ left: "0%" }))], { optional: true }),
      ///query("@*", animateChild()),
    ]),
  ]),
]);
