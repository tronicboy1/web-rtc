import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "booleanToNumber",
})
export class BooleanToNumberPipe implements PipeTransform {
  transform(value: boolean) {
    return Number(value);
  }
}
