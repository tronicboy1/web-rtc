export class Utils {
  static getFormData = (event: Event) => {
    event.preventDefault();
    const target = event.currentTarget;
    if (!(target instanceof HTMLFormElement)) throw TypeError("Must be used with HTMLFormElement.");
    return { formData: new FormData(target), form: target };
  };
}
