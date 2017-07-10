import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiLightsComponent } from './huewi-lights.component';

describe('HuewiLightsComponent', () => {
  let component: HuewiLightsComponent;
  let fixture: ComponentFixture<HuewiLightsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiLightsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiLightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
