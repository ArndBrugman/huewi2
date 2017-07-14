import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiLightDetailsComponent } from './huewi-light-details.component';

describe('HuewiLightDetailsComponent', () => {
  let component: HuewiLightDetailsComponent;
  let fixture: ComponentFixture<HuewiLightDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiLightDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiLightDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
