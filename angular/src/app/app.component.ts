import { Component } from "@angular/core";
import { Router } from "@angular/router";
import { AuthService } from "@services/auth.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "angular";
  public isAuth = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.getAuthState().subscribe((user) => {
      this.isAuth = Boolean(user);
      if (!this.isAuth) this.router.navigateByUrl("/auth");
    });
  }

  public handleLogoutClick = () => this.authService.signOutUser();
}
