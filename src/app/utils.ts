export class Utils {
  static getFormData = (event: Event) => {
    event.preventDefault();
    const target = event.currentTarget;
    if (!(target instanceof HTMLFormElement)) throw TypeError("Must be used with HTMLFormElement.");
    return { formData: new FormData(target), form: target };
  };

  static getImageDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        const { result } = reader;
        if (typeof result !== "string") throw TypeError("Reader result type was incorrect.");
        return resolve(result);
      });

      reader.addEventListener("error", reject);

      reader.readAsDataURL(file);
    });
}
