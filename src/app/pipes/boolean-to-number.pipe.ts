import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "booleanToNumber",
})
export class BooleanToNumberPipe implements PipeTransform {
  transform(value: boolean, ...args: unknown[]): unknown {
    return Number(value);
  }
}
