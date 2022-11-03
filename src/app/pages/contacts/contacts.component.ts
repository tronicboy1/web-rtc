import { Component, OnInit } from "@angular/core";
import { ContactService } from "@services/contact.service";
import { Subject, Subscription } from "rxjs";
import { Utils } from "src/app/utils";
import "@web-components/base-modal";
import { Router } from "@angular/router";
import { CallQueryParameters } from "src/app/app-routing.module";
import { UserData } from "@services/user.service";

@Component({
  selector: "app-contacts",
  templateUrl: "./contacts.component.html",
  styleUrls: ["./contacts.component.css"],
})
export class ContactsComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  private errorTimeout?: ReturnType<typeof setTimeout>;
  public contacts: UserData[] = [];
  public loading = false;
  public error = "";
  public uidToDelete = "";
  /** Must manually stop observables after any deletion else you get ghost contacts. */
  private deleteSubject = new Subject<string>()

  constructor(private contactService: ContactService, private router: Router) {}

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
    this.setLoading(this.contactService.addContact(email).then(() => form.reset()));
  };

  private setLoading<T>(promise: Promise<T>) {
    this.loading = true;
    this.error = "";
    return Promise.resolve(promise)
      .catch((error) => {
        if (!(error instanceof Error)) return;
        this.error = error.message;
        if (this.errorTimeout) clearTimeout(this.errorTimeout);
        this.errorTimeout = setTimeout(() => (this.error = ""), 5000);
      })
      .finally(() => (this.loading = false));
  }

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
