import { TestBed } from '@angular/core/testing';

import { UidRegisterService } from './uid-register.service';

describe('UidRegisterService', () => {
  let service: UidRegisterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UidRegisterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
