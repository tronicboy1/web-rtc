import { TestBed } from '@angular/core/testing';

import { InRoomGuard } from './in-room.guard';

describe('InRoomGuard', () => {
  let guard: InRoomGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(InRoomGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});
