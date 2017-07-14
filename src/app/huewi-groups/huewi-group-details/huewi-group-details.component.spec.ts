import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiGroupDetailsComponent } from './huewi-group-details.component';

describe('HuewiGroupDetailsComponent', () => {
  let component: HuewiGroupDetailsComponent;
  let fixture: ComponentFixture<HuewiGroupDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiGroupDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiGroupDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
