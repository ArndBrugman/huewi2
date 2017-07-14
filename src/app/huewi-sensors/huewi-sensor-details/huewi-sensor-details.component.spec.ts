import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiSensorDetailsComponent } from './huewi-sensor-details.component';

describe('HuewiSensorDetailsComponent', () => {
  let component: HuewiSensorDetailsComponent;
  let fixture: ComponentFixture<HuewiSensorDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiSensorDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiSensorDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
