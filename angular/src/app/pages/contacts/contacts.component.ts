import { Component, OnInit } from "@angular/core";
import { Contacts, ContactService } from "@services/contact.service";
import { Subscription } from "rxjs";
import { Utils } from "src/app/utils";
import "@web-components/base-modal";
import { Router } from "@angular/router";

@Component({
  selector: "app-contacts",
  templateUrl: "./contacts.component.html",
  styleUrls: ["./contacts.component.css"],
})
export class ContactsComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  private errorTimeout?: ReturnType<typeof setTimeout>;
  public contacts: Contacts = [];
  public loading = false;
  public error = "";
  public emailToDelete = "";

  constructor(private contactService: ContactService, private router: Router) {}

  ngOnInit(): void {
    this.subscriptions.push(this.contactService.watchContacts().subscribe((contacts) => (this.contacts = contacts)));
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

  public handleAudioCallClick = (email: string) => {
    this.router.navigate(["/call"], { queryParams: { email, isVideo: false, polite: false } });
  };

  public handleVideoCallClick = (email: string) => {
    this.router.navigate(["/call"], { queryParams: { email, isVideo: true, polite: false } });
  };

  public handlContactTileDeleteClick = (email: string) => (this.emailToDelete = email);
  public handleDeleteContact = () => {
    this.contactService.deleteContact(this.emailToDelete);
    this.emailToDelete = "";
  };
  public handleDeleteModalClosed = () => (this.emailToDelete = "");
}
