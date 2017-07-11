import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiGroupComponent } from './huewi-group.component';

describe('HuewiGroupComponent', () => {
  let component: HuewiGroupComponent;
  let fixture: ComponentFixture<HuewiGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
