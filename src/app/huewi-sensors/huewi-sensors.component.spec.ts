import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiSensorsComponent } from './huewi-sensors.component';

describe('HuewiSensorsComponent', () => {
  let component: HuewiSensorsComponent;
  let fixture: ComponentFixture<HuewiSensorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiSensorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiSensorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
