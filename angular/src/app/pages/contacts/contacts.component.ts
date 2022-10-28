import { Component, OnInit } from "@angular/core";
import { Contacts, ContactService } from "@services/contact.service";
import { Subscription } from "rxjs";
import { Utils } from "src/app/utils";

@Component({
  selector: "app-contacts",
  templateUrl: "./contacts.component.html",
  styleUrls: ["./contacts.component.css"],
})
export class ContactsComponent implements OnInit {
  private subscriptions: Subscription[] = [];
  public contacts: Contacts = [];

  constructor(private contactService: ContactService) {}

  ngOnInit(): void {
    this.subscriptions.push(this.contactService.watchContacts().subscribe((contacts) => (this.contacts = contacts)));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  public handleAddContactSubmit: EventListener = (event) => {
    const { formData } = Utils.getFormData(event);
    const email = formData.get("email")!.toString().trim();
    this.contactService.addContact(email).then();
  };
}
