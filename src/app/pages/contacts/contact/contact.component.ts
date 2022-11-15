import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { ChatService } from "@services/chat.service";
import { mergeMap, take } from "rxjs";
import { CallQueryParameters } from "src/app/app-routing.module";
import { ContactWithMessage } from "../contacts.component";

@Component({
  selector: "app-contact",
  templateUrl: "./contact.component.html",
  styleUrls: ["./contact.component.css"],
})
export class ContactComponent implements OnInit {
  @Input("contact")
  public contact?: ContactWithMessage;
  @Output()
  public delete = new EventEmitter<string>();

  constructor(private authService: AuthService, private chatService: ChatService, private router: Router) {}

  ngOnInit(): void {}

  public handleContactClick = (theirUid: string) => {
    this.authService
      .getUid()
      .pipe(
        mergeMap((myUid) => this.chatService.getRoom([myUid, theirUid])),
        take(1),
      )
      .subscribe((roomId) => {
        if (!roomId) throw Error("Room with both users was not found.");
        this.router.navigate(["/chat", roomId]);
      });
  };
  public handleAudioCallClick = (event: Event, uid: string) => {
    event.stopPropagation();
    const queryParams: CallQueryParameters = { "their-uid": uid, "is-video": 0, polite: 0 };
    this.router.navigate(["/call"], { queryParams });
  };

  public handleVideoCallClick = (event: Event, uid: string) => {
    event.stopPropagation();
    const queryParams: CallQueryParameters = { "their-uid": uid, "is-video": 1, polite: 0 };
    this.router.navigate(["/call"], { queryParams });
  };

  public handlContactTileDeleteClick = (event: Event, uid: string) => {
    event.stopPropagation();
    this.delete.emit(uid);
  };
}
