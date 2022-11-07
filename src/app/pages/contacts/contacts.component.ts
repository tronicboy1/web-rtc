import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { ChatService, Message } from "@services/chat.service";
import { ContactService } from "@services/contact.service";
import { UserData } from "@services/user.service";
import "@web-components/base-modal";
import { catchError, finalize, mergeMap, Observable, of, Subject, Subscription, take } from "rxjs";
import { CallQueryParameters } from "src/app/app-routing.module";
import { Utils } from "src/app/utils";

@Component({
  selector: "app-contacts",
  templateUrl: "./contacts.component.html",
  styleUrls: ["./contacts.component.css", "../../styles/single-input-form.css"],
})
export class ContactsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private errorTimeout?: ReturnType<typeof setTimeout>;
  public contacts: (UserData & { latestMessage?: Message })[] = [];
  public loading = false;
  public error = "";
  public uidToDelete = "";
  /** Must manually stop observables after any deletion else you get ghost contacts. */
  private deleteSubject = new Subject<string>();

  constructor(
    private contactService: ContactService,
    private router: Router,
    private authService: AuthService,
    private chatService: ChatService,
  ) {}

  ngOnInit(): void {
    this.subscriptions.push(
      this.contactService.watchContacts(this.deleteSubject).subscribe((contacts) => {
        this.contacts = contacts;
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public handleAddContactSubmit: EventListener = (event) => {
    const { formData, form } = Utils.getFormData(event);
    const email = formData.get("email")!.toString().trim();
    this.setLoading(this.contactService.addContact(email)).subscribe(() => form.reset());
  };

  /** Sets loading property and error details to class variables for async operations. */
  private setLoading<T>(observable: Observable<T>): Observable<T>;
  private setLoading<T>(promise: Promise<T>): Promise<T>;
  private setLoading<T>(promiseOrObservable: Promise<T> | Observable<T>) {
    this.loading = true;
    this.error = "";
    const isPromise = promiseOrObservable instanceof Promise;
    if (isPromise) {
      return Promise.resolve(promiseOrObservable)
        .catch((error) => {
          if (!(error instanceof Error)) return;
          this.handleError(error);
        })
        .finally(() => (this.loading = false));
    } else {
      return promiseOrObservable.pipe(
        catchError((error) => {
          if (!(error instanceof Error)) throw error;
          this.handleError(error);
          return of();
        }),
        finalize(() => {
          this.loading = false;
        }),
      );
    }
  }
  private handleError(error: Error) {
    this.error = error.message;
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => (this.error = ""), 5000);
  }

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
  public handleAudioCallClick = (uid: string) => {
    const queryParams: CallQueryParameters = { "their-uid": uid, "is-video": 0, polite: 0 };
    this.router.navigate(["/call"], { queryParams });
  };

  public handleVideoCallClick = (uid: string) => {
    const queryParams: CallQueryParameters = { "their-uid": uid, "is-video": 1, polite: 0 };
    this.router.navigate(["/call"], { queryParams });
  };

  public handlContactTileDeleteClick = (uid: string) => (this.uidToDelete = uid);
  public handleDeleteContact = () => {
    this.contactService.deleteContact(this.uidToDelete);
    this.deleteSubject.next(this.uidToDelete);
    this.uidToDelete = "";
  };
  public handleDeleteModalClosed = () => (this.uidToDelete = "");
}
