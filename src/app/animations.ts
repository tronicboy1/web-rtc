import { animate, animateChild, group, query, style, transition, trigger } from "@angular/animations";
import { AuthComponent } from "./pages/auth/auth.component";
import { CallComponent } from "./pages/call/call.component";
import { ContactsComponent } from "./pages/contacts/contacts.component";

export const slideInAnimation = trigger("routeAnimations", [
  transition(`${ContactsComponent.name} => ${CallComponent.name}`, [
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
  ]),
  transition(`${AuthComponent.name} => ${ContactsComponent.name}`, [
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
    query(":enter", [style({ left: "100%" })], { optional: true }),
    query(":leave", animateChild(), { optional: true }),
    group([
      query(":leave", [animate("200ms ease-out", style({ left: "-100%", opacity: 0 }))], { optional: true }),
      query(":enter", [animate("300ms ease-out", style({ left: "0%" }))], { optional: true }),
      ///query("@*", animateChild()),
    ]),
  ]),
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
