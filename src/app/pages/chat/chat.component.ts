import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { ChatService, DetailedMessage } from "@services/chat.service";
import { map, mergeMap, Subscription, take } from "rxjs";

@Component({
  selector: "app-chat",
  templateUrl: "./chat.component.html",
  styleUrls: ["./chat.component.css"],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  private subscriptions: Subscription[] = [];
  public messages: DetailedMessage[] = [];
  @ViewChild("messageList")
  private ul!: ElementRef<HTMLUListElement>;
  private mutationObserver: MutationObserver;
  private intersectionObserver: IntersectionObserver;

  constructor(private chatService: ChatService, private route: ActivatedRoute) {
    this.mutationObserver = new MutationObserver(this.mutationObserverCallback);
    this.intersectionObserver = new IntersectionObserver(this.intersectionObserverCallback, {
      root: document,
      rootMargin: "0px",
      threshold: 1.0,
    });
  }

  ngOnInit(): void {
    console.log("ChatComponent");
    this.getRoomId()
      .pipe(mergeMap((roomId) => this.chatService.watchMessagesByRoomId(roomId)))
      .subscribe((messages) => {
        this.messages = messages;
      });
  }

  ngAfterViewInit(): void {
    console.log("view init", this.ul);
    this.mutationObserver.observe(this.ul.nativeElement, { childList: true });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public handleSendMessage: EventListener = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) throw TypeError("This listener must be used with a Form.");
    const formData = new FormData(form);
    const message = formData.get("message")!.toString();
    this.getRoomId()
      .pipe(
        take(1),
        mergeMap((roomId) => this.chatService.sendMessage(roomId, message)),
      )
      .subscribe();
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
      record.addedNodes.forEach((node) => {
        if (!(node instanceof HTMLLIElement)) throw TypeError("Can only watch LI.");
        this.intersectionObserver.observe(node);
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
      console.log("intersecting element: ", messageId, viewed);
    });
}
