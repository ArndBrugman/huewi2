import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiHomeComponent } from './huewi-home.component';

describe('HuewiHomeComponent', () => {
  let component: HuewiHomeComponent;
  let fixture: ComponentFixture<HuewiHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
