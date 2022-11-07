import { Injectable } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from "@angular/router";
import { AuthService } from "@services/auth.service";
import { ChatService } from "@services/chat.service";
import { map, mergeMap, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class InRoomGuard implements CanActivate {
  constructor(private authService: AuthService, private chatService: ChatService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const roomId = route.paramMap.get("roomId");
    if (!roomId) return false;
    let myUid: string;
    return this.authService.getUid().pipe(
      mergeMap((uid) => {
        myUid = uid;
        return this.chatService.getRoomById(roomId);
      }),
      map((room) => {
        if (!room) return false;
        const { members } = room;
        return members.includes(myUid);
      }),
      map((canAccess) => {
        /** to be fixed : https://github.com/angular/angular/issues/16211 */
        if (!canAccess) this.router.navigateByUrl("/contacts");
        return canAccess;
      }),
    );
  }
}
