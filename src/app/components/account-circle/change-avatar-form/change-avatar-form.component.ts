import { Component, OnInit } from "@angular/core";
import type { User } from "firebase/auth";
import { Utils } from "src/app/utils";
import { InheritableAccountDetailsComponent } from "../inheritable-account-details-component";

@Component({
  selector: "app-change-avatar-form",
  templateUrl: "./change-avatar-form.component.html",
  styleUrls: ["./change-avatar-form.component.css", "../../../styles/basic-form.css"],
})
export class ChangeAvatarFormComponent extends InheritableAccountDetailsComponent {
  public user?: User;
  private photoPreview?: string;
  get photoURL(): string | undefined {
    if (this.photoPreview) return this.photoPreview;
    if (this.user?.photoURL) return this.user.photoURL;
    return undefined;
  }

  public handleSubmit: EventListener = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) throw TypeError("Listener must be used with form.");
    const formData = new FormData(form);
    const displayName = formData.get("display-name")!.toString().trim();
    const avatar = formData.get("avatar")!;
    if (!(avatar instanceof File)) throw TypeError("Avatar formdata should be file.");
    this.loading = true;
    this.authService
      .updateAccount({ displayName }, avatar.size ? avatar : undefined)
      .then(() => this.submitted.emit(null))
      .catch(console.error)
      .finally(() => (this.loading = false));
  };

  public handleFileInput: EventListener = (event) => {
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) throw TypeError("This listener must be used with file input.");
    const { files } = input;
    if (!files) throw TypeError("Files were not associated with file input.");
    const photo = files[0];
    if (!photo.size) return;
    Utils.getImageDataURL(photo).then((dataURL) => (this.photoPreview = dataURL));
  };
}
