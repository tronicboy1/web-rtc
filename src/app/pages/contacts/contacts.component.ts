import { Component, OnDestroy, OnInit } from "@angular/core";
import { Message } from "@services/chat.service";
import { ContactService } from "@services/contact.service";
import { UserData } from "@services/user.service";
import "@web-components/base-modal";
import { catchError, finalize, Observable, of, Subject, Subscription } from "rxjs";
import { Utils } from "src/app/utils";

export type ContactWithMessage = UserData & { latestMessage?: Message };

@Component({
  selector: "app-contacts",
  templateUrl: "./contacts.component.html",
  styleUrls: ["./contacts.component.css", "../../styles/single-input-form.css"],
})
export class ContactsComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  private errorTimeout?: ReturnType<typeof setTimeout>;
  public contacts: ContactWithMessage[] = [];
  public formLoading = false;
  public contactsLoading = true;
  public formError = "";
  public uidToDelete = "";

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.subscribeToContacts();
    document.addEventListener("visibilitychange", this.handleVisibilityStateChange);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    document.removeEventListener("visibilitychange", this.handleVisibilityStateChange);
  }

  private handleVisibilityStateChange = () => {
    const { visibilityState } = document;
    switch (visibilityState) {
      case "hidden":
        this.subscriptions.forEach((sub) => sub.unsubscribe());
        break;
      case "visible":
        this.subscribeToContacts();
        break;
    }
  };

  private subscribeToContacts() {
    this.subscriptions.push(
      this.contactService.watchContacts().subscribe((contacts) => {
        this.contactsLoading && (this.contactsLoading = false);
        this.contacts = contacts;
      }),
    );
  }

  public handleAddContactSubmit: EventListener = (event) => {
    const { formData, form } = Utils.getFormData(event);
    const email = formData.get("email")!.toString().trim();
    this.setformLoading(this.contactService.addContact(email)).subscribe(() => form.reset());
  };

  /** Sets formLoading property and error details to class variables for async operations. */
  private setformLoading<T>(observable: Observable<T>): Observable<T>;
  private setformLoading<T>(promise: Promise<T>): Promise<T>;
  private setformLoading<T>(promiseOrObservable: Promise<T> | Observable<T>) {
    this.formLoading = true;
    this.formError = "";
    const isPromise = promiseOrObservable instanceof Promise;
    if (isPromise) {
      return Promise.resolve(promiseOrObservable)
        .catch((error) => {
          if (!(error instanceof Error)) return;
          this.handleError(error);
        })
        .finally(() => (this.formLoading = false));
    } else {
      return promiseOrObservable.pipe(
        catchError((error) => {
          if (!(error instanceof Error)) throw error;
          this.handleError(error);
          return of();
        }),
        finalize(() => {
          this.formLoading = false;
        }),
      );
    }
  }
  private handleError(error: Error) {
    this.formError = error.message;
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
    this.errorTimeout = setTimeout(() => (this.formError = ""), 5000);
  }

  public handlContactTileDeleteClick = (uid: string) => {
    this.uidToDelete = uid;
  };
  public handleDeleteContact = () => {
    this.contactService.deleteContact(this.uidToDelete);
    this.uidToDelete = "";
  };
  public handleDeleteModalClosed = () => (this.uidToDelete = "");
}
