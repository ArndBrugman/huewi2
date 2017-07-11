import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HuewiDetailsComponent } from './huewi-details.component';

describe('HuewiDetailsComponent', () => {
  let component: HuewiDetailsComponent;
  let fixture: ComponentFixture<HuewiDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HuewiDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HuewiDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
