import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountDetailsFormComponent } from './account-details-form.component';

describe('AccountDetailsFormComponent', () => {
  let component: AccountDetailsFormComponent;
  let fixture: ComponentFixture<AccountDetailsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AccountDetailsFormComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountDetailsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
