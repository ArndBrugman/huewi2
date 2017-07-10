import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiSchedulesComponent } from './huewi-schedules.component';

describe('HuewiSchedulesComponent', () => {
  let component: HuewiSchedulesComponent;
  let fixture: ComponentFixture<HuewiSchedulesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiSchedulesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiSchedulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
