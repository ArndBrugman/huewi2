import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiConnectionstatusComponent } from './huewi-connectionstatus.component';

describe('HuewiConnectionstatusComponent', () => {
  let component: HuewiConnectionstatusComponent;
  let fixture: ComponentFixture<HuewiConnectionstatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiConnectionstatusComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiConnectionstatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
