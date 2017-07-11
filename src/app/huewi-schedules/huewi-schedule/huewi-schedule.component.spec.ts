import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiScheduleComponent } from './huewi-schedule.component';

describe('HuewiScheduleComponent', () => {
  let component: HuewiScheduleComponent;
  let fixture: ComponentFixture<HuewiScheduleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
