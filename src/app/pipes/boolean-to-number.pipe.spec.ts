import { BooleanToNumberPipe } from './boolean-to-number.pipe';

describe('BooleanToNumberPipe', () => {
  it('create an instance', () => {
    const pipe = new BooleanToNumberPipe();
    expect(pipe).toBeTruthy();
  });
});
