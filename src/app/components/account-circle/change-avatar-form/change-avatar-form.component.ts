import { AfterViewInit, Component, ElementRef, ViewChild } from "@angular/core";
import type { User } from "firebase/auth";
import { fromEvent, map } from "rxjs";
import { Utils } from "src/app/utils";
import { InheritableAccountDetailsComponent } from "../inheritable-account-details-component";

@Component({
  selector: "app-change-avatar-form",
  templateUrl: "./change-avatar-form.component.html",
  styleUrls: ["../../../styles/basic-form.css", "./change-avatar-form.component.css"],
})
export class ChangeAvatarFormComponent extends InheritableAccountDetailsComponent implements AfterViewInit {
  public user?: User;
  public filename?: string;
  public photoPreview?: string;

  @ViewChild("photoCanvas")
  private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("fileInput")
  private fileInput!: ElementRef<HTMLInputElement>;
  @ViewChild("previewImage")
  private previewImage!: ElementRef<HTMLImageElement>;

  ngAfterViewInit(): void {
    if (!this.canvas) throw TypeError("Canvase element was not found.");
    if (!this.fileInput) throw TypeError("File Input was not found.");
    if (!this.previewImage) throw TypeError("Preview image element not found.");
    const previewImageLoadSubscription = fromEvent(this.previewImage.nativeElement, "load")
      .pipe(
        map((event) => {
          const imgElement = event.target;
          if (!(imgElement instanceof HTMLImageElement)) throw TypeError();
          return imgElement;
        }),
      )
      .subscribe((imgElement) => {
        const context = this.canvas.nativeElement.getContext("2d");
        if (!context) throw Error("Unable to load context.");
        const { width, height } = this.canvas.nativeElement;
        context!.clearRect(0, 0, width, height);
        context.drawImage(imgElement, 0, 0, imgElement.naturalWidth, imgElement.naturalHeight, 0, 0, width, height);
        this.canvas.nativeElement.toBlob((blob) => {
          if (!blob) throw Error("No blob was generated");
          const file = new File([blob], "img.png", { lastModified: Date.now() });
          const transfer = new DataTransfer();
          transfer.items.add(file);
          this.fileInput.nativeElement.files = transfer.files;
        });
      });
    this.subscriptions.push(previewImageLoadSubscription);
  }

  public handleSubmit: EventListener = (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!(form instanceof HTMLFormElement)) throw TypeError("Listener must be used with form.");
    const formData = new FormData(form);
    const avatar = formData.get("avatar")!;
    if (!(avatar instanceof File)) throw TypeError("Avatar formdata should be file.");
    if (!avatar.size) return;
    this.loading = true;
    this.authService
      .updateAccount({}, avatar)
      .then(() => this.submitted.emit(null))
      .catch(console.error)
      .finally(() => (this.loading = false));
  };

  public handleFileInput: EventListener = (event) => {
    this.filename = undefined;
    const input = event.currentTarget;
    if (!(input instanceof HTMLInputElement)) throw TypeError("This listener must be used with file input.");
    const { files } = input;
    if (!files) throw TypeError("Files were not associated with file input.");
    const photo = files[0];
    if (!photo.size) return;
    this.filename = photo.name;
    Utils.getImageDataURL(photo).then((dataURL) => (this.photoPreview = dataURL));
  };
}
