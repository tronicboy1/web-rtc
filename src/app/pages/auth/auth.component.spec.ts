import { ComponentFixture, TestBed, tick } from "@angular/core/testing";
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
  let nativeElement: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AuthComponent],
      providers: [{ provide: AuthService, useClass: MockAuthService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthComponent);
    component = fixture.componentInstance;
    nativeElement = fixture.nativeElement;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("Header is displayed", () => {
    const h1 = nativeElement.querySelector("h1");
    expect(h1).toBeTruthy();
    expect(h1?.innerText.length).toBeGreaterThan(0);
  });

  it("Login mode displays forgot password", () => {
    const loginModeButton = nativeElement.querySelector<HTMLButtonElement>("button#login-button")!;
    expect(loginModeButton).toBeTruthy();
    loginModeButton.click();
    fixture.detectChanges();
    const classListArray = Array.from(loginModeButton.classList);
    expect(classListArray).toContain("active");
    const forgotPasswordLink = nativeElement.querySelector("a[data-test-id='forgot-password']");
    expect(forgotPasswordLink).toBeTruthy();
  });

  it("Register mode can be activated", () => {
    const registerModeButton = nativeElement.querySelector<HTMLButtonElement>("button#register-button")!;
    expect(registerModeButton).toBeTruthy();
    registerModeButton.click();
    fixture.detectChanges();
    const classListArray = Array.from(registerModeButton.classList);
    expect(classListArray).toContain("active");
    const forgotPasswordLink = nativeElement.querySelector("a[data-test-id='forgot-password']");
    expect(forgotPasswordLink).toBeFalsy();
  });
});
