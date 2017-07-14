import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiScheduleDetailsComponent } from './huewi-schedule-details.component';

describe('HuewiScheduleDetailsComponent', () => {
  let component: HuewiScheduleDetailsComponent;
  let fixture: ComponentFixture<HuewiScheduleDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiScheduleDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiScheduleDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
