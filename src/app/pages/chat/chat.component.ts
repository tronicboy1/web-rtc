import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { ChatService, DetailedMessageWithUserData } from "@services/chat.service";
import { map, mergeMap, Subscription, take, forkJoin } from "rxjs";
import { Utils } from "src/app/utils";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css", "../../styles/single-input-form.css"],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscriptions: Subscription[] = [];
  public messages: DetailedMessageWithUserData[] = [];
  public myUid = "";
  public messagesLoading = true;
  @ViewChild("messageList")
  private ul!: ElementRef<HTMLUListElement>;
  private mutationObserver: MutationObserver;
  private intersectionObserver: IntersectionObserver;

  constructor(private chatService: ChatService, private route: ActivatedRoute, private authService: AuthService) {
    this.mutationObserver = new MutationObserver(this.mutationObserverCallback);
    this.intersectionObserver = new IntersectionObserver(this.intersectionObserverCallback, {
      root: document,
      rootMargin: "0px",
      threshold: 1.0,
    });
  }

  ngOnInit(): void {
    this.subscriptions.push(
      this.getRoomId()
        .pipe(mergeMap((roomId) => this.chatService.watchMessagesByRoomId(roomId)))
        .subscribe((messages) => {
          this.messagesLoading && (this.messagesLoading = false);
          this.messages = messages;
        }),
      this.authService
        .getUid()
        .pipe(take(1))
        .subscribe((uid) => (this.myUid = uid)),
    );
  }

  ngAfterViewInit(): void {
    this.mutationObserver.observe(this.ul.nativeElement, { childList: true });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public handleSendMessage: EventListener = (event) => {
    const { formData, form } = Utils.getFormData(event);
    const message = formData.get("message")!.toString();
    this.getRoomId()
      .pipe(
        take(1),
        mergeMap((roomId) => this.chatService.sendMessage(roomId, message)),
      )
      .subscribe();
    form.reset();
  };

  private getRoomId() {
    return this.route.paramMap.pipe(
      map((params) => {
        const roomId = params.get("roomId");
        if (!roomId) throw Error("Room Id must be specified in path: /chat/abc123def");
        return roomId;
      }),
    );
  }

  private mutationObserverCallback: MutationCallback = (records) =>
    records.forEach((record) => {
      if (record.type !== "childList") return;
      record.addedNodes.forEach((node, i) => {
        if (!(node instanceof HTMLLIElement)) throw TypeError("Can only watch LI.");
        this.intersectionObserver.observe(node);
        if (i === record.addedNodes.length - 1) {
          node.scrollIntoView();
        }
      });
      record.removedNodes.forEach((node) => {
        if (!(node instanceof HTMLLIElement)) throw TypeError("Can only watch LI.");
        this.intersectionObserver.unobserve(node);
      });
    });

  private intersectionObserverCallback: IntersectionObserverCallback = (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const { target } = entry;
      if (!(target instanceof HTMLLIElement)) throw TypeError("Can only watch LI.");
      const messageId = target.dataset["messageId"]!;
      const viewed = Boolean(Number(target.dataset["viewed"]));
      if (viewed) return;
      forkJoin([this.authService.getUid().pipe(take(1)), this.getRoomId().pipe(take(1))]).subscribe(([uid, roomId]) =>
        this.chatService.addReaderToMessage(roomId, messageId, uid),
      );
    });
}
