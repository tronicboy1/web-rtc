import { ComponentFixture, TestBed } from "@angular/core/testing";
import { AuthService } from "@services/auth.service";
import { UserCredential } from "firebase/auth";

import { AuthComponent } from "./auth.component";

class MockAuthService {
  signInUser(_email: string, _password: string): Promise<void> {
    return Promise.resolve();
  }
  createUser(_email: string, _password: string): Promise<void> {
    return Promise.resolve();
  }
  sendSignInEmail(_email: string): Promise<{}> {
    return Promise.resolve({});
  }
  sendPasswordResetEmail(_email: string): Promise<void> {
    return Promise.resolve();
  }
}

describe("AuthComponent", () => {
  let component: AuthComponent;
  let fixture: ComponentFixture<AuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthComponent],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
