import { TestBed, inject } from '@angular/core/testing';

import { HuepiService } from './huepi.service';

describe('HuepiService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HuepiService]
    });
  });

  it('should be created', inject([HuepiService], (service: HuepiService) => {
    expect(service).toBeTruthy();
  }));
});
