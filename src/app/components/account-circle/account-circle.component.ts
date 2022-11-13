import { Component, OnInit } from "@angular/core";
import "@web-components/base-modal";

@Component({
  selector: "app-account-circle",
  templateUrl: "./account-circle.component.html",
  styleUrls: ["./account-circle.component.css"],
})
export class AccountCircleComponent implements OnInit {
  public showAccountMenu = false;
  public showChangeEmailModal = false;
  public showAccountDetailsModal = false;

  constructor() {}

  ngOnInit(): void {}

  public toggleAccountMenu = (force?: boolean) => (this.showAccountMenu = force ?? !this.showAccountMenu);
  public toggleChangeEmailModal = (force?: boolean) => {
    this.showAccountMenu = false;
    this.showChangeEmailModal = force ?? !this.showChangeEmailModal;
  };
  public toggleAccountDetailsModal = (force?: boolean) => {
    this.showAccountMenu = false;
    this.showAccountDetailsModal = force ?? !this.showAccountDetailsModal;
  };
}
