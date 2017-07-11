import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiSensorComponent } from './huewi-sensor.component';

describe('HuewiSensorComponent', () => {
  let component: HuewiSensorComponent;
  let fixture: ComponentFixture<HuewiSensorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiSensorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiSensorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
