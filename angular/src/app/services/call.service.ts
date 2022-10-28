import { Injectable } from "@angular/core";
import { app } from "@custom-firebase/firebase";
import { getDatabase } from "firebase/database";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class CallService {
  private db = getDatabase(app);
  constructor(private authService: AuthService) {}
}
